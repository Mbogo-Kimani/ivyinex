# Brevo Email System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Get Brevo API Key

1. Sign up at [https://www.brevo.com](https://www.brevo.com) (free tier available)
2. Go to **Settings** → **SMTP & API**
3. Click **Generate a new API key**
4. Copy the API key

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
BREVO_API_KEY=your_api_key_here
EMAIL_FROM_NAME=Wifi Mtaani
# IMPORTANT: Use your personal email (Gmail, Outlook, etc.)
# This email must be verified in Brevo (see step 3)
EMAIL_FROM_ADDRESS=your.personal.email@gmail.com
FRONTEND_URL=https://your-frontend-domain.com
BREVO_LIST_ID=1  # Optional: Your Brevo contact list ID
```

### 3. Verify Your Personal Email in Brevo

**This is required before sending emails!**

1. In Brevo dashboard, go to **Settings** → **Senders**
2. Click **Add a sender**
3. Enter your **personal email address** (e.g., `your.email@gmail.com`)
   - You can use Gmail, Outlook, Yahoo, or any personal email
   - No custom domain needed!
4. Enter sender name: "Wifi Mtaani"
5. Click **Save**
6. Check your email inbox for a verification email from Brevo
7. Click the verification link in the email
8. Once verified, use this exact email address in `EMAIL_FROM_ADDRESS`

**Note**: The system will automatically use this email as both the "From" and "Reply-To" address for all emails.

### 4. Test the System

```bash
# Test forgot password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

Check your email for the password reset link!

---

## 📧 Email Templates in Brevo Dashboard

### Option 1: Use Inline Templates (Current Implementation)

The system uses inline HTML templates - no Brevo dashboard setup needed!

### Option 2: Create Brevo Templates (Advanced)

If you want to use Brevo's template editor:

1. **Go to Brevo Dashboard** → **Campaigns** → **Email Templates**
2. **Create New Template** for each type:
   - Password Reset Template
   - Welcome Email Template
   - Marketing Email Template

3. **Template Variables** (if using Brevo templates):
   - `{{params.name}}` - User name
   - `{{params.resetLink}}` - Password reset link
   - `{{params.loginLink}}` - Login link

4. **Update Code** to use template IDs:
   ```javascript
   // In emailService.js
   sendSmtpEmail.templateId = 1; // Your template ID
   sendSmtpEmail.params = { name: userName, resetLink: link };
   ```

**Note**: Current implementation uses inline HTML for maximum flexibility and easier customization.

---

## ✅ Features Implemented

- ✅ Password reset via email
- ✅ Welcome emails on registration
- ✅ Password changed confirmation
- ✅ Marketing email campaigns
- ✅ Contact management (Brevo sync)
- ✅ Unsubscribe functionality
- ✅ Rate limiting (security)
- ✅ Responsive email templates
- ✅ Error handling & logging

---

## 🔒 Security Features

- Rate limiting: 3 password reset requests per 15 minutes
- Secure tokens: 32-byte random, hashed before storage
- Token expiry: 30 minutes
- User enumeration prevention
- One-time use tokens

---

## 📝 Next Steps

1. **Test password reset flow** on your frontend
2. **Verify emails are delivered** (check spam folder initially)
3. **Set up domain verification** in Brevo (improves deliverability)
4. **Monitor email delivery** in Brevo dashboard
5. **Configure contact lists** for marketing campaigns

---

## 🆘 Need Help?

- Check `BREVO_EMAIL_SYSTEM_DOCUMENTATION.md` for detailed guide
- Review server logs: `backend/logs/app.log`
- Check Brevo dashboard for delivery status
- Verify environment variables are set correctly

---

**Ready to go!** 🎉


