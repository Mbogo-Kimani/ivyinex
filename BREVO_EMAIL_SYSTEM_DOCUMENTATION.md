# Brevo Email System - Complete Implementation Guide

## Overview

This document provides a comprehensive guide to the Brevo (formerly Sendinblue) email system implementation for the Wifi Mtaani platform. The system includes password recovery, welcome emails, marketing campaigns, and contact management.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Environment Variables](#environment-variables)
3. [Installation](#installation)
4. [Email Service](#email-service)
5. [Password Recovery Flow](#password-recovery-flow)
6. [Email Templates](#email-templates)
7. [Marketing Emails](#marketing-emails)
8. [Brevo Dashboard Setup](#brevo-dashboard-setup)
9. [API Endpoints](#api-endpoints)
10. [Frontend Integration](#frontend-integration)
11. [Security Features](#security-features)
12. [Troubleshooting](#troubleshooting)

---

## Architecture

### Backend Structure

```
backend/
├── lib/
│   ├── emailService.js      # Brevo API integration
│   ├── emailTemplates.js    # HTML email templates
│   └── emailMarketing.js    # Marketing email utilities
├── middleware/
│   └── rateLimiter.js       # Rate limiting for sensitive endpoints
├── models/
│   └── User.js              # User model with email preferences
└── routes/
    ├── auth.js              # Password reset endpoints
    └── email.js             # Email marketing endpoints
```

### Frontend Structure

```
frontend/
├── pages/
│   └── auth/
│       ├── forgot-password.js
│       └── reset-password.js
└── lib/
    └── api.js              # API client with email methods
```

---

## Environment Variables

### Required Variables

Add these to your `.env` file or deployment environment:

```bash
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here

# Email Configuration
# IMPORTANT: Use your personal email address (must be verified in Brevo)
EMAIL_FROM_NAME=Wifi Mtaani
EMAIL_FROM_ADDRESS=your.personal.email@gmail.com

# Frontend URL (for reset links)
FRONTEND_URL=https://your-frontend-domain.com

# Optional: Brevo Contact List ID
BREVO_LIST_ID=1
```

### Getting Your Brevo API Key

1. Sign up at [https://www.brevo.com](https://www.brevo.com)
2. Go to **Settings** → **SMTP & API**
3. Click **Generate a new API key**
4. Copy the API key and add it to your environment variables

### Verifying Your Sender Email (Personal Email)

**IMPORTANT**: You must verify your personal email address in Brevo before sending emails.

1. Go to **Settings** → **Senders**
2. Click **Add a sender**
3. Enter your personal email address (e.g., `your.email@gmail.com`)
4. Enter your name (e.g., "Wifi Mtaani")
5. Click **Save**
6. Check your email inbox for a verification email from Brevo
7. Click the verification link in the email
8. Once verified, use this email address in `EMAIL_FROM_ADDRESS`

**Note**: You can use any personal email (Gmail, Outlook, Yahoo, etc.) - it doesn't need to be a custom domain. The email just needs to be verified in Brevo.

---

## Installation

### Backend Dependencies

The following packages are required (already installed):

```bash
npm install @getbrevo/brevo express-rate-limit
```

### Package Details

- **@getbrevo/brevo**: Official Brevo SDK for Node.js
- **express-rate-limit**: Rate limiting middleware for security

---

## Email Service

### Core Service (`backend/lib/emailService.js`)

The email service provides:

- **Transactional Email Sending**: Send emails via Brevo API
- **Contact Management**: Add/update contacts in Brevo
- **Async Email Sending**: Non-blocking email delivery
- **Error Handling**: Comprehensive error logging

### Key Functions

```javascript
// Send email
await emailService.sendEmail({
    to: 'user@example.com',
    toName: 'John Doe',
    subject: 'Password Reset',
    htmlContent: '<html>...</html>',
});

// Add contact to Brevo
await emailService.addContactToBrevo(
    'user@example.com',
    { FIRSTNAME: 'John', PHONE: '254712345678' },
    [listId],
    false
);
```

---

## Password Recovery Flow

### 1. Forgot Password Request

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```
OR
```json
{
  "phone": "254712345678"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "If an account with that email/phone exists, a password reset link has been sent."
}
```

**Security Features**:
- Rate limited: 3 requests per 15 minutes per IP
- User enumeration prevention: Always returns success message
- Secure token generation: 32-byte random token, hashed before storage
- Token expiry: 30 minutes

### 2. Password Reset

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Security Features**:
- Token validation: Verifies token hash and expiry
- One-time use: Token is cleared after successful reset
- Password validation: Minimum 6 characters
- Confirmation email: Sent after successful reset

---

## Email Templates

### Available Templates

1. **Password Reset** (`getPasswordResetTemplate`)
   - User name
   - Reset link with token
   - Expiry notice
   - Security warning

2. **Welcome Email** (`getWelcomeTemplate`)
   - Welcome message
   - Login link
   - Getting started tips

3. **Password Changed** (`getPasswordChangedTemplate`)
   - Confirmation message
   - Security notice

4. **Marketing Email** (`getMarketingTemplate`)
   - Customizable title and content
   - Call-to-action button
   - Unsubscribe link

### Template Features

- ✅ Responsive design (mobile-friendly)
- ✅ Inline CSS (email client compatibility)
- ✅ Branded styling (Wifi Mtaani colors)
- ✅ Accessible HTML structure
- ✅ Dark mode support (where applicable)

---

## Marketing Emails

### Sending Marketing Emails

**Endpoint**: `POST /api/email/marketing/send` (Admin only)

**Request Body**:
```json
{
  "subject": "Special Offer - 50% Off!",
  "title": "Limited Time Offer",
  "content": "<p>Get 50% off on all packages this week!</p>",
  "ctaText": "View Packages",
  "ctaLink": "https://your-frontend.com/packages",
  "userIds": [] // Optional: specific user IDs, or empty for all opted-in users
}
```

**Response**:
```json
{
  "success": true,
  "message": "Marketing email campaign initiated for 150 users",
  "total": 150,
  "sent": 148,
  "failed": 2
}
```

### Opt-In/Opt-Out Management

Users are automatically added to Brevo when they register (if email provided and opt-in enabled).

**Unsubscribe Flow**:
1. User clicks unsubscribe link in email
2. Link format: `/api/email/unsubscribe?email=user@example.com&token=hash`
3. User preferences updated in database
4. Brevo contact updated (blacklisted)

**Resubscribe** (Admin only):
- Endpoint: `POST /api/email/marketing/resubscribe`
- Body: `{ "email": "user@example.com" }`

---

## Brevo Dashboard Setup

### 1. Create Contact Lists

1. Log in to Brevo dashboard
2. Go to **Contacts** → **Lists**
3. Click **Create a list**
4. Name it (e.g., "Wifi Mtaani Users")
5. Copy the List ID (you'll need this for `BREVO_LIST_ID`)

### 2. Configure Sender

1. Go to **Settings** → **Senders**
2. Add your sender email (must be verified)
3. Verify the email address via the verification email
4. Use this email in `EMAIL_FROM_ADDRESS`

### 3. Set Up Transactional Templates (Optional)

While the system uses inline HTML templates, you can also create templates in Brevo:

1. Go to **Campaigns** → **Email Templates**
2. Create a new template
3. Use the template ID in your code (requires code modification)

**Note**: The current implementation uses inline HTML templates for maximum flexibility.

### 4. Verify Domain (Recommended for Production)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Add DNS records as instructed
4. Verify domain ownership

This improves email deliverability and allows custom "from" addresses.

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password with token | Public |
| POST | `/api/auth/change-password` | Change password (logged in) | User |

### Email Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/email/unsubscribe` | Unsubscribe from emails | Public |
| POST | `/api/email/marketing/send` | Send marketing email | Admin |
| POST | `/api/email/marketing/resubscribe` | Resubscribe user | Admin |

---

## Frontend Integration

### Forgot Password Page

**Route**: `/auth/forgot-password`

**Features**:
- Email or phone input
- Loading states
- Success message
- Error handling
- Link to login page

### Reset Password Page

**Route**: `/auth/reset-password?token=...`

**Features**:
- Token validation
- Password strength indicator
- Confirm password field
- Success redirect to login
- Expired token handling

### API Usage

```javascript
import { forgotPassword, resetPassword } from '../lib/api';

// Request password reset
await forgotPassword({ email: 'user@example.com' });

// Reset password
await resetPassword(token, 'newPassword123');
```

---

## Security Features

### ✅ Implemented Security Measures

1. **Rate Limiting**
   - Password reset: 3 requests per 15 minutes per IP
   - Prevents brute force attacks

2. **Token Security**
   - 32-byte cryptographically secure random tokens
   - Tokens hashed before database storage
   - 30-minute expiry time
   - One-time use (cleared after reset)

3. **User Enumeration Prevention**
   - Always returns success message (even if user doesn't exist)
   - Prevents attackers from discovering valid emails

4. **Password Validation**
   - Minimum 6 characters
   - Enforced on both frontend and backend

5. **Async Email Sending**
   - Emails sent asynchronously (don't block requests)
   - Failures logged without exposing errors to users

6. **Error Logging**
   - All email failures logged
   - No sensitive data in error messages
   - Comprehensive audit trail

---

## Troubleshooting

### Common Issues

#### 1. Emails Not Sending

**Check**:
- ✅ `BREVO_API_KEY` is set correctly
- ✅ API key has proper permissions
- ✅ Sender email is verified in Brevo
- ✅ Check server logs for error messages

**Solution**:
```bash
# Test email service initialization
# Check logs for: "Email service initialized successfully"
```

#### 2. "Invalid API Key" Error

**Solution**:
1. Verify API key in Brevo dashboard
2. Regenerate API key if needed
3. Restart backend server after updating environment variables

#### 3. "Sender email not verified" Error

**Solution**:
1. Go to Brevo dashboard → **Settings** → **Senders**
2. Ensure your personal email is listed and verified
3. If not verified, check your email inbox for verification link
4. Verify the email address
5. Ensure `EMAIL_FROM_ADDRESS` matches the verified email exactly
6. Restart backend server after updating

#### 4. Emails Going to Spam

**Solutions**:
- Use a verified sender email (personal email is fine)
- Warm up your IP (send gradually)
- Include unsubscribe links
- Avoid spam trigger words
- Note: Domain verification is optional when using personal email

#### 4. Rate Limiting Too Strict

**Adjust** in `backend/middleware/rateLimiter.js`:
```javascript
windowMs: 15 * 60 * 1000, // Time window
max: 3, // Max requests
```

#### 5. Contacts Not Syncing to Brevo

**Check**:
- ✅ `BREVO_LIST_ID` is set (optional)
- ✅ User has email address
- ✅ `emailMarketingOptIn` is true
- ✅ Check logs for Brevo API errors

---

## Testing

### Test Password Reset Flow

1. **Request Reset**:
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

2. **Check Email** (use Brevo dashboard or email client)

3. **Reset Password**:
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "token_from_email", "newPassword": "newpass123"}'
```

### Test Marketing Email

```bash
curl -X POST http://localhost:5000/api/email/marketing/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "subject": "Test Email",
    "title": "Test",
    "content": "<p>This is a test email</p>",
    "ctaText": "Click Here",
    "ctaLink": "https://example.com"
  }'
```

---

## Best Practices

### ✅ Do's

- Always use environment variables for credentials
- Test emails in development before production
- Monitor email delivery rates in Brevo dashboard
- Keep email templates responsive and accessible
- Include unsubscribe links in marketing emails
- Log email failures for debugging
- Use rate limiting on sensitive endpoints

### ❌ Don'ts

- Never expose API keys in frontend code
- Don't block requests while sending emails
- Don't reveal if user exists in password reset
- Don't send marketing emails to unsubscribed users
- Don't hard-code email addresses or links
- Don't ignore email delivery failures

---

## Production Checklist

Before deploying to production:

- [ ] Brevo API key configured
- [ ] Sender email verified in Brevo
- [ ] Domain verified (recommended)
- [ ] `FRONTEND_URL` set correctly
- [ ] Rate limiting configured appropriately
- [ ] Email templates tested
- [ ] Unsubscribe flow tested
- [ ] Error logging configured
- [ ] Monitoring set up for email failures
- [ ] Backup email service considered (optional)

---

## Support

For issues or questions:

1. Check server logs: `backend/logs/app.log`
2. Check Brevo dashboard for delivery status
3. Review error messages in API responses
4. Verify environment variables are set correctly

---

## License

This implementation is part of the Wifi Mtaani platform.

---

**Last Updated**: January 2025  
**Version**: 1.0.0


