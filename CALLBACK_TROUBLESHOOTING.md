# Callback Troubleshooting Guide

## 🔴 Problem: Payment Stays Pending

The payment status remains 'pending' even after user completes payment on phone. This means the Daraja callback is not being received or processed.

---

## 🔍 Diagnostic Steps

### **Step 1: Check if Callback Endpoint is Accessible**

Test if your callback URL is publicly accessible:

```bash
# Test GET request (should return OK)
curl https://ivyinex.onrender.com/api/checkout/test-callback

# Expected response:
# {"status":"ok","message":"Callback endpoint is accessible",...}
```

**If this fails:** Your callback URL is not accessible from the internet.

---

### **Step 2: Check Backend Logs**

Look for these log entries in your backend:

1. **"Daraja callback received"** - Means callback was received
2. **"Daraja callback parsed"** - Means callback was parsed
3. **"Payment not found for callback"** - Means payment lookup failed
4. **"Payment failed"** - Means callback processed payment as failed

**If you don't see "Daraja callback received":**
- Callback is not reaching your backend
- Check callback URL configuration
- Check if backend is accessible from internet

---

### **Step 3: Verify Callback URL Configuration**

**In Daraja Portal:**
1. Go to your app settings
2. Check "Lipa Na M-Pesa Online" settings
3. Verify callback URL matches: `https://ivyinex.onrender.com/api/checkout/daraja-callback`

**In Render Environment Variables:**
```env
DARAJA_CALLBACK_URL=https://ivyinex.onrender.com/api/checkout/daraja-callback
```

**Important:**
- Must be HTTPS (not HTTP)
- Must be publicly accessible
- Must match exactly what's in Daraja portal
- No trailing slash

---

### **Step 4: Check Pending Payments**

Use the new endpoint to see pending payments:

```bash
GET /api/checkout/pending-payments
```

This shows:
- Payment IDs
- CheckoutRequestIDs
- How long they've been pending
- Phone numbers

---

### **Step 5: Test Callback Manually**

If callback never arrives, you can manually simulate it:

```bash
POST /api/checkout/test-callback
Body: {
  "paymentId": "your-payment-id",
  "resultCode": 1,
  "resultDesc": "Insufficient balance"
}
```

This will:
- Mark payment as failed
- Store error message
- Frontend polling will detect it

---

## 🔧 Common Issues

### **Issue 1: Callback URL Not Accessible**

**Symptoms:**
- Payment stays pending
- No "callback received" logs
- Callback endpoint returns 404 or timeout

**Fix:**
- Verify backend URL is correct
- Check if backend is running
- Verify HTTPS is enabled
- Test callback endpoint manually

---

### **Issue 2: Payment Lookup Fails**

**Symptoms:**
- "callback received" logs exist
- "Payment not found for callback" logs
- Payment stays pending

**Fix:**
- Check if CheckoutRequestID matches
- Verify payment.providerPayload has CheckoutRequestID
- Use test-callback endpoint to manually process

**New Fallback Logic:**
- Now tries to find payment by account reference
- Falls back to most recent pending payment (last 10 minutes)
- Should catch most cases

---

### **Issue 3: Callback Format Mismatch**

**Symptoms:**
- Callback received but not parsed correctly
- resultCode always 0 or undefined
- Payment not updated

**Fix:**
- Check callback body format in logs
- Verify Daraja is sending correct format
- Check if callback structure matches expected format

---

## 🛠️ New Features Added

### **1. Enhanced Payment Lookup** ✅

**File:** `backend/routes/checkout.js`

**Changes:**
- Primary: Find by CheckoutRequestID
- Fallback 1: Find by account reference (hotspot_<paymentId>)
- Fallback 2: Find most recent pending payment (last 10 minutes)

**Why:**
- Handles cases where CheckoutRequestID doesn't match
- Accounts for timing issues
- More robust payment matching

---

### **2. Test Callback Endpoint** ✅

**Endpoint:** `POST /api/checkout/test-callback`

**Purpose:** Manually simulate callback for testing

**Usage:**
```javascript
// In browser console or Postman
fetch('/api/checkout/test-callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'your-payment-id',
    resultCode: 1,
    resultDesc: 'Insufficient balance'
  })
})
```

**Result:**
- Payment marked as failed
- Error message stored
- Frontend polling will detect it

---

### **3. Pending Payments Endpoint** ✅

**Endpoint:** `GET /api/checkout/pending-payments`

**Purpose:** View pending payments for debugging

**Response:**
```json
{
  "count": 2,
  "payments": [
    {
      "paymentId": "...",
      "amountKES": 10,
      "packageKey": "kumi-1hr",
      "phone": "254748449048",
      "createdAt": "2026-01-06T09:41:47.427Z",
      "checkoutRequestID": "ws_CO_...",
      "ageMinutes": 5
    }
  ]
}
```

---

### **4. Enhanced Logging** ✅

**Changes:**
- Logs full callback body (first 1000 chars)
- Logs request headers
- Logs callback parsing details
- Logs payment lookup attempts

**Benefits:**
- Easier to debug callback issues
- See exact callback format
- Track payment lookup process

---

## 📋 Quick Fix Checklist

If payment stays pending:

1. ✅ **Check callback URL is accessible:**
   ```bash
   curl https://ivyinex.onrender.com/api/checkout/test-callback
   ```

2. ✅ **Check backend logs for callbacks:**
   - Look for "Daraja callback received"
   - Check if payment lookup succeeded

3. ✅ **Check pending payments:**
   ```bash
   GET /api/checkout/pending-payments
   ```

4. ✅ **Manually process if needed:**
   ```bash
   POST /api/checkout/test-callback
   Body: { "paymentId": "...", "resultCode": 1 }
   ```

5. ✅ **Verify callback URL in Daraja portal:**
   - Must match exactly
   - Must be HTTPS
   - Must be publicly accessible

---

## 🎯 Immediate Solution

If you have a pending payment right now:

1. **Get the payment ID from browser console** (from the polling logs)

2. **Manually process it:**
   ```bash
   POST https://ivyinex.onrender.com/api/checkout/test-callback
   Content-Type: application/json
   
   {
     "paymentId": "695cd330ef63c7cef7530e15",
     "resultCode": 1,
     "resultDesc": "Insufficient balance"
   }
   ```

3. **Frontend will detect the failure** on next poll (within 3 seconds)

---

## 🔍 Why Callbacks Might Not Arrive

### **1. Callback URL Not Configured**
- Check `DARAJA_CALLBACK_URL` environment variable
- Must be set in Render

### **2. Callback URL Not Accessible**
- Safaricom servers must be able to reach it
- Must be HTTPS
- Must be publicly accessible (not localhost)

### **3. Callback URL Mismatch**
- URL in Daraja portal must match environment variable
- Must match exactly (including https://)

### **4. Backend Not Running**
- Check if backend is deployed and running
- Check Render service status

### **5. Network/Firewall Issues**
- Render might be blocking incoming requests
- Check Render logs for incoming requests

---

## 📝 Next Steps

1. **Check backend logs** for "Daraja callback received"
2. **Test callback endpoint** accessibility
3. **Verify callback URL** in Daraja portal
4. **Use test-callback** to manually process pending payments
5. **Check pending payments** endpoint for debugging

---

**Status:** Enhanced callback handling with fallbacks and test endpoints  
**Date:** January 2025  
**Use test-callback endpoint to manually process pending payments!**


