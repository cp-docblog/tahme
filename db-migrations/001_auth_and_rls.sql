-- =====================================================
-- Authentication & User Management Migration
-- =====================================================
-- This migration adds:
-- 1. Enhanced profiles table with activity tracking
-- 2. Row Level Security (RLS) policies
-- 3. Automatic profile creation triggers
-- 4. Helper functions for permission checks
-- =====================================================

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Check if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin or owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage other users
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin_or_owner();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_sign_in_at
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_sign_in_at on login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on all tables
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.clients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.campaigns;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and owners can insert profiles" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and owners can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and owners can update clients" ON public.clients;
DROP POLICY IF EXISTS "Owners can delete clients" ON public.clients;

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins and owners can manage campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Only owners can view creds" ON public.creds;
DROP POLICY IF EXISTS "Only owners can manage creds" ON public.creds;

-- =====================================================
-- Profiles Table Policies
-- =====================================================

-- All authenticated users can view active profiles
CREATE POLICY "Users can view all active profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Users can update their own profile (except role and is_active)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- Owners can update any profile
CREATE POLICY "Owners can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Admins and owners can create new profiles (invite users)
CREATE POLICY "Admins and owners can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_owner());

-- =====================================================
-- Clients Table Policies
-- =====================================================

-- All authenticated users can view clients
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- Admins and owners can create clients
CREATE POLICY "Admins and owners can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_owner());

-- Admins and owners can update clients
CREATE POLICY "Admins and owners can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_owner())
  WITH CHECK (public.is_admin_or_owner());

-- Only owners can delete clients
CREATE POLICY "Owners can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- =====================================================
-- Campaigns Table Policies
-- =====================================================

-- All authenticated users can view campaigns
CREATE POLICY "Authenticated users can view campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (true);

-- Admins and owners can manage campaigns
CREATE POLICY "Admins and owners can manage campaigns"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (public.is_admin_or_owner())
  WITH CHECK (public.is_admin_or_owner());

-- =====================================================
-- Creds Table Policies (Sensitive Data)
-- =====================================================

-- Only owners can view credentials
CREATE POLICY "Only owners can view creds"
  ON public.creds FOR SELECT
  TO authenticated
  USING (public.is_owner());

-- Only owners can manage credentials
CREATE POLICY "Only owners can manage creds"
  ON public.creds FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- =====================================================
-- Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.creds TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN public.profiles.is_active IS 'Soft delete flag - inactive users cannot login';
COMMENT ON COLUMN public.profiles.invited_by IS 'User who invited this user';
COMMENT ON COLUMN public.profiles.last_sign_in_at IS 'Last successful login timestamp';

COMMENT ON FUNCTION public.is_owner() IS 'Returns true if current user is an active owner';
COMMENT ON FUNCTION public.is_admin_or_owner() IS 'Returns true if current user is an active admin or owner';
COMMENT ON FUNCTION public.can_manage_users() IS 'Returns true if current user can invite/manage other users';
COMMENT ON FUNCTION public.get_my_role() IS 'Returns the role of the current authenticated user';
