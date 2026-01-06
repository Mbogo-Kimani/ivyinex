# Personal Email Setup for Brevo - Quick Guide

## Overview

The email system is configured to use your **personal email address** as the sender. This means you can use Gmail, Outlook, Yahoo, or any personal email without needing a custom domain or DNS setup.

---

## ✅ What Was Updated

1. **Email Service** (`backend/lib/emailService.js`)
   - ✅ Sender email loaded from `EMAIL_FROM_ADDRESS` environment variable
   - ✅ Reply-To header automatically set to match sender email
   - ✅ Sender validation on startup
   - ✅ Graceful error handling for unverified senders
   - ✅ Improved error messages for Brevo sender validation errors

2. **Documentation**
   - ✅ Updated to reflect personal email usage
   - ✅ Added verification instructions
   - ✅ Removed domain-specific requirements

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your Brevo API Key

1. Sign up at [https://www.brevo.com](https://www.brevo.com)
2. Go to **Settings** → **SMTP & API**
3. Click **Generate a new API key**
4. Copy the API key

### Step 2: Verify Your Personal Email in Brevo

**This is required before sending emails!**

1. In Brevo dashboard, go to **Settings** → **Senders**
2. Click **Add a sender**
3. Enter your **personal email address** (e.g., `your.email@gmail.com`)
4. Enter sender name: "Wifi Mtaani"
5. Click **Save**
6. Check your email inbox for a verification email from Brevo
7. Click the verification link in the email
8. Wait for verification to complete (usually instant)

### Step 3: Configure Environment Variables

Add to your `.env` file:

```bash
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM_NAME=Wifi Mtaani
EMAIL_FROM_ADDRESS=your.personal.email@gmail.com  # Use the verified email from Step 2
FRONTEND_URL=https://your-frontend-domain.com
```

**Important**: 
- `EMAIL_FROM_ADDRESS` must match the email you verified in Brevo exactly
- Use the same email address you verified in Step 2

---

## 📧 How It Works

### Email Sending

When an email is sent:
- **From**: Your personal email (from `EMAIL_FROM_ADDRESS`)
- **From Name**: "Wifi Mtaani" (from `EMAIL_FROM_NAME`)
- **Reply-To**: Same as From (your personal email)
- **To**: Recipient email address

### All Email Types Use Personal Email

The following emails all use your personal email as the sender:
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Password changed confirmations
- ✅ Marketing emails

---

## 🔍 Verification

### Check Sender Configuration

1. **Start your backend server**
2. **Check logs** for:
   ```
   Email service initialized successfully
   ```
3. **If you see warnings**, check:
   ```
   EMAIL_FROM_ADDRESS not set. Configure your personal email address...
   ```
   → Make sure `EMAIL_FROM_ADDRESS` is set in your `.env` file

### Test Email Sending

1. **Request a password reset**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Check logs** for:
   ```
   Email sent successfully
   from: your.personal.email@gmail.com
   ```

3. **If you see errors**, check:
   ```
   Sender email not verified in Brevo...
   ```
   → Go back to Step 2 and verify your email in Brevo dashboard

---

## ⚠️ Common Issues

### Issue: "Sender email not verified in Brevo"

**Solution**:
1. Go to Brevo dashboard → **Settings** → **Senders**
2. Check if your email is listed
3. If not listed, add it (see Step 2 above)
4. If listed but not verified, check your email inbox for verification link
5. Click the verification link
6. Ensure `EMAIL_FROM_ADDRESS` matches the verified email exactly
7. Restart your backend server

### Issue: "EMAIL_FROM_ADDRESS not configured"

**Solution**:
1. Add `EMAIL_FROM_ADDRESS=your.email@gmail.com` to your `.env` file
2. Use the exact email address you verified in Brevo
3. Restart your backend server

### Issue: Emails not being received

**Solutions**:
1. Check spam/junk folder
2. Verify sender email in Brevo dashboard
3. Check server logs for errors
4. Ensure `EMAIL_FROM_ADDRESS` matches verified email exactly
5. Wait a few minutes (email delivery can take time)

---

## 🔒 Security Notes

- ✅ No API keys exposed in frontend
- ✅ Sender email validated before sending
- ✅ Errors logged without exposing credentials
- ✅ Reply-To header set for better deliverability

---

## 📝 Environment Variables Reference

```bash
# Required
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_ADDRESS=your.personal.email@gmail.com  # Must be verified in Brevo

# Recommended
EMAIL_FROM_NAME=Wifi Mtaani
FRONTEND_URL=https://your-frontend-domain.com

# Optional
BREVO_LIST_ID=1
```

---

## ✅ Checklist

Before going to production:

- [ ] Brevo API key configured
- [ ] Personal email verified in Brevo dashboard
- [ ] `EMAIL_FROM_ADDRESS` set to verified email
- [ ] `EMAIL_FROM_NAME` set to application name
- [ ] Test password reset email sent successfully
- [ ] Check email received in inbox (not spam)
- [ ] Reply-To header working (test reply)

---

## 🎉 You're All Set!

Your email system is now configured to use your personal email address. All emails will be sent from your verified personal email, and recipients can reply directly to that email.

**Next Steps**:
1. Test the password reset flow
2. Monitor email delivery in Brevo dashboard
3. Check server logs for any issues

---

**Last Updated**: January 2025  
**Version**: 1.1.0 (Personal Email Support)

