-- =====================================================
-- Fix RLS Circular Dependency
-- =====================================================
-- This migration fixes the circular dependency issue where
-- helper functions couldn't read the profiles table due to
-- RLS policies blocking them.
--
-- The issue: is_owner() and is_admin_or_owner() functions
-- query the profiles table, but RLS policies on that table
-- prevent the query, causing "not_admin" errors.
--
-- The fix: Use DECLARE variables with SECURITY DEFINER to
-- properly bypass RLS when checking permissions.
-- =====================================================

-- Fix is_owner function to properly bypass RLS
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  -- SECURITY DEFINER allows this to bypass RLS
  -- Using DECLARE and SELECT INTO ensures RLS is bypassed
  SELECT role, is_active INTO user_role, user_active
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return false if user not found or inactive
  RETURN user_role = 'owner' AND COALESCE(user_active, false) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Fix is_admin_or_owner function to properly bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_active BOOLEAN;
BEGIN
  -- SECURITY DEFINER allows this to bypass RLS
  -- Using DECLARE and SELECT INTO ensures RLS is bypassed
  SELECT role, is_active INTO user_role, user_active
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return false if user not found or inactive
  RETURN user_role IN ('admin', 'owner') AND COALESCE(user_active, false) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update can_manage_users for consistency (though it just calls is_admin_or_owner)
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin_or_owner();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================
-- Verification
-- =====================================================
-- After running this migration:
-- 1. Owner users should be able to invite new users
-- 2. Owner users should be able to change user roles
-- 3. Admin users should be able to invite new users
-- 4. Staff users should NOT be able to invite or manage users
-- =====================================================
