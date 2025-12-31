# Email Templates for Supabase

This directory contains custom email templates for Supabase authentication emails.

## Templates

### 1. invite-user.html
Used when admins/owners invite new users to the platform.

**Variables:**
- `{{ .Email }}` - The invited user's email address
- `{{ .Role }}` - The role assigned to the user (owner/admin/staff)
- `{{ .ConfirmationURL }}` - The magic link for account activation

### 2. reset-password.html
Used when users request a password reset.

**Variables:**
- `{{ .ConfirmationURL }}` - The password reset link

## How to Use in Supabase

### Step 1: Access Email Templates

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Invite User Template

1. Select **"Invite user"** template
2. Copy the contents of `invite-user.html`
3. Paste into the template editor
4. Click **Save**

### Step 3: Configure Password Reset Template

1. Select **"Reset Password"** template  
2. Copy the contents of `reset-password.html`
3. Paste into the template editor
4. Click **Save**

### Step 4: Configure Email Settings

In **Authentication** → **Settings**:

1. **Site URL**: Set to your production URL (e.g., `https://tashweesh.com`)
2. **Redirect URLs**: Add allowed redirect URLs
3. **Email Rate Limits**: Configure as needed
4. **SMTP Settings** (Optional): Use custom SMTP server for better deliverability

## Template Features

### Design
- ✨ Modern, premium design with gradients
- 📱 Fully responsive (mobile-friendly)
- 🌙 RTL (Right-to-Left) support for Arabic
- 🎨 Tashweesh brand colors (turquoise/purple)
- 🔒 Security-focused messaging

### Invite User Template
- Clear role indication
- Feature highlights
- 24-hour expiration notice
- Support contact information

### Password Reset Template
- Security warnings
- Password strength tips
- Link expiration notice (1 hour)
- Fallback plain text link

## Customization

### Colors
Main brand colors used:
- Primary: `#2dd4bf` (Turquoise)
- Secondary: `#14b8a6` (Dark Turquoise)
- Accent: `#667eea` → `#764ba2` (Purple gradient)
- Warning: `#f59e0b` (Amber)

### Fonts
- Primary: Cairo (Arabic-optimized)
- Fallback: Segoe UI, Tahoma, Geneva, Verdana, sans-serif

### Logo
Currently using a text-based logo (ت). To use an image logo:

Replace:
```html
<div class="logo">
    <span class="logo-text">ت</span>
</div>
```

With:
```html
<div class="logo">
    <img src="https://your-domain.com/logo.png" alt="تشويش" style="width: 60px; height: 60px;">
</div>
```

## Testing

### Test in Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter a test email
4. Check the email to verify template rendering

### Test Password Reset

1. Use the password reset flow in your app
2. Check the email to verify template rendering

## Support Email

Update the support email in templates:
- Current: `support@tashweesh.com`
- Change to your actual support email address

## Best Practices

1. **Always test** templates before deploying to production
2. **Keep templates updated** with your brand guidelines
3. **Monitor email deliverability** using Supabase analytics
4. **Use custom SMTP** for better deliverability in production
5. **Add unsubscribe links** if sending marketing emails (not required for auth emails)

## Troubleshooting

### Emails not sending
- Check Supabase email rate limits
- Verify SMTP configuration
- Check spam folder
- Verify email address is valid

### Template not rendering correctly
- Ensure all variables are properly formatted: `{{ .VariableName }}`
- Test in different email clients (Gmail, Outlook, etc.)
- Check for HTML/CSS errors

### Arabic text not displaying correctly
- Ensure `dir="rtl"` is set on html tag
- Verify `lang="ar"` is set
- Check font family includes Arabic-supporting fonts

## Production Checklist

- [ ] Update support email address
- [ ] Add company logo (if using image)
- [ ] Test on multiple email clients
- [ ] Configure custom SMTP (recommended)
- [ ] Set proper Site URL and Redirect URLs
- [ ] Test invite flow end-to-end
- [ ] Test password reset flow end-to-end
- [ ] Monitor email deliverability rates
