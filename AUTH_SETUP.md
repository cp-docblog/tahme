# Authentication Setup Guide

This guide will help you set up authentication for the Tashweesh application.

## Prerequisites

- Supabase project created
- Environment variables configured (`.env` file)

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `db-migrations/001_auth_and_rls.sql`
4. Paste and run the SQL script
5. Verify that all tables, functions, and policies were created successfully

## Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates** in Supabase dashboard
2. Configure the **Invite User** template:
   - Copy contents from `email-templates/invite-user.html`
   - Paste into the template editor
   - Save
3. Configure the **Reset Password** template:
   - Copy contents from `email-templates/reset-password.html`
   - Paste into the template editor
   - Save

See `email-templates/README.md` for detailed instructions.

## Step 3: Create Initial Owner Account

You need to create the first owner account manually. Choose one of these methods:

### Method A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. Go to **SQL Editor** and run:

```sql
INSERT INTO public.profiles (id, email, full_name, role, is_active)
VALUES (
  '<user-id-from-auth-users>',
  'owner@tashweesh.com',
  'Owner Name',
  'owner',
  true
);
```

### Method B: Via SQL Only

```sql
-- This will create both auth user and profile
-- Replace with your actual email and password
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user (you'll need to use Supabase dashboard or API for this)
  -- Then insert profile:
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    '<user-id-from-auth-users>',
    'owner@tashweesh.com',
    'Owner Name',
    'owner',
    true
  );
END $$;
```

## Step 4: Test Authentication

1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Login with the owner credentials you created
5. Verify you're redirected to the dashboard
6. Check that the user menu appears in the header

## Step 5: Invite Additional Users

1. Navigate to **Users** page (only visible to admins/owners)
2. Click **دعوة مستخدم** (Invite User)
3. Fill in:
   - Email address
   - Full name
   - Role (staff/admin/owner)
4. Click **إرسال الدعوة** (Send Invitation)
5. The user will receive an email with an invitation link
6. They can click the link to set their password and access the system

## Features

### Authentication
- ✅ Email/password login
- ✅ Session persistence
- ✅ Automatic session refresh
- ✅ Logout functionality
- ✅ Protected routes

### User Management
- ✅ User invitation system
- ✅ Role-based access control (owner/admin/staff)
- ✅ User activation/deactivation
- ✅ Role updates (owner only)
- ✅ Last login tracking
- ✅ Invited by tracking

### Security
- ✅ Row Level Security (RLS) policies
- ✅ Role-based permissions
- ✅ Secure credential storage
- ✅ Active user validation
- ✅ Self-deactivation prevention

## Roles & Permissions

### Owner
- Full system access
- Can invite users (all roles)
- Can change user roles
- Can deactivate users
- Can access all pages
- Can manage sensitive credentials

### Admin
- Can invite users (staff/admin only)
- Can manage clients and campaigns
- Can access Users page
- Cannot change roles
- Cannot deactivate users

### Staff
- Can view clients and campaigns
- Can create campaigns
- Cannot access Users page
- Cannot invite users
- Cannot manage other users

## Troubleshooting

### Users can't login
- Verify the user exists in `auth.users`
- Check that a profile exists in `public.profiles`
- Ensure `is_active` is `true`
- Verify RLS policies are enabled

### Invitation emails not sending
- Check Supabase email configuration
- Verify email templates are configured
- Check spam folder
- Verify SMTP settings (if using custom SMTP)

### Permission errors
- Verify RLS policies are correctly applied
- Check user role in `profiles` table
- Ensure helper functions are created
- Test with SQL Editor using different user contexts

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Verify `database.types.ts` matches your schema
- Run `npx tsc --noEmit` to check for type errors

## Database Schema

### profiles table
```sql
- id: UUID (references auth.users)
- email: TEXT
- full_name: TEXT
- role: TEXT (owner/admin/staff)
- is_active: BOOLEAN
- invited_by: UUID (references profiles)
- last_sign_in_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### RLS Policies
- All authenticated users can view active profiles
- Users can update their own profile (except role/is_active)
- Owners can update any profile
- Admins and owners can create profiles

## Next Steps

1. **Test the authentication flow thoroughly**
2. **Invite your team members**
3. **Configure custom SMTP for production** (optional but recommended)
4. **Set up 2FA for owner accounts** (recommended)
5. **Monitor user activity** via last_sign_in_at

## Support

For issues or questions:
- Check the implementation plan in `.gemini/antigravity/brain/.../implementation_plan.md`
- Review the database migration file
- Check Supabase logs for errors
- Verify environment variables are set correctly
