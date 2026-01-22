# Daraja "Merchant does not exist" Error - Fix Guide

## 🔴 Error Details

**Error Code:** `500.001.1001`  
**Error Message:** "Merchant does not exist"  
**Status Code:** `500`

This error occurs when the Daraja API cannot find or validate the merchant/shortcode credentials.

---

## 🔍 Root Causes

### **1. Incorrect Shortcode**
- The `DARAJA_SHORTCODE` environment variable doesn't match your registered shortcode
- Shortcode format is wrong (should be numeric, e.g., `174379` for sandbox)

### **2. Incorrect Passkey**
- The `DARAJA_PASSKEY` doesn't match the passkey in your Daraja portal
- Passkey is missing or incorrectly copied

### **3. Environment Mismatch**
- Using production credentials with sandbox URL (or vice versa)
- Sandbox shortcode: `174379`
- Production shortcode: Your registered business shortcode

### **4. Credentials Not Activated**
- Shortcode not fully registered/activated in Daraja portal
- Passkey not generated or activated

### **5. Missing Environment Variables**
- `DARAJA_SHORTCODE` not set
- `DARAJA_PASSKEY` not set
- Variables set but empty

---

## ✅ How to Fix

### **Step 1: Verify Your Daraja Portal Settings**

1. **Log in to Daraja Portal:**
   - Sandbox: https://developer.safaricom.co.ke/
   - Production: https://developer.safaricom.co.ke/

2. **Check Your App Credentials:**
   - Go to "My Apps" → Select your app
   - Verify `Consumer Key` and `Consumer Secret`
   - These should match `DARAJA_CONSUMER_KEY` and `DARAJA_CONSUMER_SECRET`

3. **Check Your Shortcode:**
   - Go to "Shortcodes" section
   - For **Sandbox**: Should be `174379`
   - For **Production**: Should be your registered business shortcode
   - Verify this matches `DARAJA_SHORTCODE`

4. **Check Your Passkey:**
   - Go to "Shortcodes" → Select your shortcode
   - Find "Lipa Na M-Pesa Online Passkey"
   - Copy the passkey exactly (it's long, make sure you get it all)
   - Verify this matches `DARAJA_PASSKEY`

---

### **Step 2: Update Environment Variables**

#### **For Sandbox (Testing):**

```env
DARAJA_BASE_URL=https://sandbox.safaricom.co.ke
DARAJA_CONSUMER_KEY=your_sandbox_consumer_key
DARAJA_CONSUMER_SECRET=your_sandbox_consumer_secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your_sandbox_passkey
DARAJA_CALLBACK_URL=https://your-backend.onrender.com/api/checkout/daraja-callback
```

#### **For Production:**

```env
DARAJA_BASE_URL=https://api.safaricom.co.ke
DARAJA_CONSUMER_KEY=your_production_consumer_key
DARAJA_CONSUMER_SECRET=your_production_consumer_secret
DARAJA_SHORTCODE=your_business_shortcode
DARAJA_PASSKEY=your_production_passkey
DARAJA_CALLBACK_URL=https://your-backend.onrender.com/api/checkout/daraja-callback
```

---

### **Step 3: Verify on Render (Your Deployment Platform)**

1. **Go to Render Dashboard:**
   - Navigate to your backend service
   - Go to "Environment" tab

2. **Check Environment Variables:**
   - Verify `DARAJA_SHORTCODE` is set correctly
   - Verify `DARAJA_PASSKEY` is set correctly
   - Verify `DARAJA_CONSUMER_KEY` is set correctly
   - Verify `DARAJA_CONSUMER_SECRET` is set correctly
   - Verify `DARAJA_BASE_URL` matches your environment (sandbox vs production)

3. **Important Notes:**
   - **No spaces** in values
   - **No quotes** around values (Render adds them automatically)
   - **Exact match** - copy/paste directly from Daraja portal
   - **Case sensitive** - passkeys are case-sensitive

---

### **Step 4: Common Issues to Check**

#### **Issue 1: Passkey Format**
- Passkey should be a long string (usually 30+ characters)
- Should NOT have spaces or line breaks
- Should be copied exactly from Daraja portal

#### **Issue 2: Shortcode Format**
- Should be numeric only (e.g., `174379`)
- Should NOT have dashes or spaces
- Sandbox: Always `174379`
- Production: Your registered business shortcode

#### **Issue 3: Environment Mismatch**
- If using sandbox, ensure:
  - `DARAJA_BASE_URL=https://sandbox.safaricom.co.ke`
  - `DARAJA_SHORTCODE=174379`
- If using production, ensure:
  - `DARAJA_BASE_URL=https://api.safaricom.co.ke`
  - `DARAJA_SHORTCODE=your_business_shortcode`

#### **Issue 4: Callback URL**
- Must be publicly accessible (HTTPS)
- Must match exactly what's registered in Daraja portal
- Format: `https://your-backend.onrender.com/api/checkout/daraja-callback`

---

### **Step 5: Test After Fixing**

1. **Restart Your Backend Service:**
   - On Render: Go to "Manual Deploy" → "Clear build cache & deploy"
   - This ensures new environment variables are loaded

2. **Test STK Push:**
   - Try initiating a payment
   - Check logs for any errors
   - Verify access token is fetched successfully

3. **Check Logs:**
   - Look for "Daraja token fetched successfully"
   - Look for "Initiating STK push"
   - If you see "Merchant does not exist" again, double-check credentials

---

## 🔧 Quick Diagnostic

Run this check to verify your configuration:

```javascript
// Check if all required variables are set
console.log('DARAJA_SHORTCODE:', process.env.DARAJA_SHORTCODE);
console.log('DARAJA_PASSKEY:', process.env.DARAJA_PASSKEY ? 'SET' : 'NOT SET');
console.log('DARAJA_CONSUMER_KEY:', process.env.DARAJA_CONSUMER_KEY ? 'SET' : 'NOT SET');
console.log('DARAJA_BASE_URL:', process.env.DARAJA_BASE_URL);
```

**Expected Output (Sandbox):**
```
DARAJA_SHORTCODE: 174379
DARAJA_PASSKEY: SET
DARAJA_CONSUMER_KEY: SET
DARAJA_BASE_URL: https://sandbox.safaricom.co.ke
```

---

## 📝 Sandbox vs Production

### **Sandbox (Testing):**
- **Shortcode:** `174379` (fixed for all sandbox apps)
- **Base URL:** `https://sandbox.safaricom.co.ke`
- **Use for:** Development and testing
- **Limitations:** Test transactions only, no real money

### **Production:**
- **Shortcode:** Your registered business shortcode
- **Base URL:** `https://api.safaricom.co.ke`
- **Use for:** Live transactions
- **Requirements:** Fully registered business, approved by Safaricom

---

## ⚠️ Important Notes

1. **Never commit credentials to Git:**
   - Keep all Daraja credentials in environment variables only
   - Use `.env` file locally (not committed)
   - Use Render environment variables for production

2. **Sandbox Credentials:**
   - Sandbox credentials are different from production
   - You need separate apps for sandbox and production
   - Sandbox shortcode is always `174379`

3. **Passkey Generation:**
   - Passkey is generated in Daraja portal
   - Each shortcode has its own passkey
   - Passkey cannot be changed, only regenerated

4. **Callback URL:**
   - Must be HTTPS in production
   - Must be publicly accessible
   - Must match exactly what's in Daraja portal

---

## 🆘 Still Having Issues?

If you've verified all the above and still getting the error:

1. **Check Daraja Portal:**
   - Ensure your app is active
   - Ensure shortcode is activated
   - Ensure passkey is generated

2. **Contact Safaricom Support:**
   - If using production, contact Safaricom Daraja support
   - They can verify your shortcode registration
   - They can help with passkey issues

3. **Check Render Logs:**
   - Look for environment variable loading
   - Check if variables are being read correctly
   - Verify no typos in variable names

---

## ✅ After Fixing

Once you've updated the credentials:

1. ✅ Restart backend service
2. ✅ Test STK push
3. ✅ Verify access token is fetched
4. ✅ Check that payment initiates successfully
5. ✅ Monitor logs for any other errors

---

**Status:** Error handling improved, but credentials need to be fixed in environment variables  
**Action Required:** Update `DARAJA_SHORTCODE` and `DARAJA_PASSKEY` in Render environment variables




