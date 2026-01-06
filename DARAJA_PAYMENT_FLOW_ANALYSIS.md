# Safaricom Daraja Payment System - Flow Analysis

## 📋 Overview

This document explains how the M-Pesa payment system works in the IVYINEX backend, from when a user initiates payment from the frontend to when access is granted.

---

## 🔄 Complete Payment Flow

### **Step 1: Frontend Initiates Payment**

**Frontend Action:**
- User selects a package and enters phone number
- Frontend calls: `POST /api/checkout/start`
- Request body:
  ```json
  {
    "phone": "0712345678",
    "packageKey": "daily-100",
    "mac": "AA:BB:CC:DD:EE:FF",
    "ip": "192.168.88.101",
    "userId": "optional-user-id"
  }
  ```

---

### **Step 2: Backend Receives Checkout Request**

**Endpoint:** `POST /api/checkout/start`  
**File:** `backend/routes/checkout.js` (lines 20-111)

**Process:**

1. **Validation** (lines 24-39):
   - Validates `phone` is provided
   - Validates `packageKey` is provided
   - Looks up package from database
   - Validates package exists and has valid price

2. **Create Pending Payment** (line 42):
   ```javascript
   const payment = await Payment.create({
     userId: userId || null,
     amountKES: pkg.priceKES,
     provider: 'daraja',
     status: 'pending'
   });
   ```
   - Creates a payment record with status `pending`
   - Stores amount, provider, and optional userId

3. **Log Checkout Start** (line 46):
   ```javascript
   await LogModel.create({
     level: 'info',
     source: 'checkout',
     message: 'checkout-started',
     metadata: {
       paymentId: payment._id,
       phone,
       packageKey,
       mac,
       ip,
       pendingToken
     }
   });
   ```
   - **⚠️ ISSUE:** This stores context in logs, not in the payment record itself
   - This makes it harder to retrieve context later

4. **Initiate STK Push** (line 51):
   ```javascript
   const stk = await stkPush({
     phone,
     amount: pkg.priceKES,
     accountRef: `hotspot_${payment._id}`
   });
   ```
   - Calls Daraja API to send STK push to user's phone
   - Uses `accountRef` format: `hotspot_<payment._id>`
   - **⚠️ ISSUE:** `packageKey` is NOT stored in payment record or accountRef

5. **Save STK Response** (lines 53-54):
   ```javascript
   payment.providerPayload = stk;
   await payment.save();
   ```
   - Stores Daraja response (includes `CheckoutRequestID`)
   - Returns response to frontend

6. **Response to Frontend** (line 55):
   ```json
   {
     "ok": true,
     "data": {
       "CheckoutRequestID": "ws_CO_...",
       "ResponseCode": "0",
       "ResponseDescription": "Success. Request accepted for processing"
     },
     "paymentId": "payment-id"
   }
   ```

---

### **Step 3: User Approves Payment on Phone**

**User Action:**
- User receives STK push notification on phone
- User enters M-Pesa PIN
- User approves payment
- Safaricom processes payment

---

### **Step 4: Daraja Sends Callback**

**Endpoint:** `POST /api/checkout/daraja-callback`  
**File:** `backend/routes/checkout.js` (lines 118-207)

**Daraja Callback Structure:**
```json
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_...",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 100
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "RFT123456789"
          },
          {
            "Name": "TransactionDate",
            "Value": 20240101120000
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          },
          {
            "Name": "AccountReference",
            "Value": "hotspot_<payment._id>"
          }
        ]
      }
    }
  }
}
```

**Process:**

1. **Log Callback** (line 121):
   - Logs entire callback for debugging

2. **Extract Callback Data** (lines 125-130):
   ```javascript
   const body = cb.Body || cb;
   const stkCallback = body.stkCallback || body;
   const checkoutRequestID = stkCallback.CheckoutRequestID || stkCallback.checkoutRequestID;
   const resultCode = stkCallback.ResultCode !== undefined ? stkCallback.ResultCode : (stkCallback.resultCode || 0);
   const resultDesc = stkCallback.ResultDesc || stkCallback.resultDesc || 'OK';
   ```
   - Handles different callback formats (flexible parsing)

3. **Find Payment Record** (lines 133-140):
   ```javascript
   const payment = await Payment.findOne({
     'providerPayload.CheckoutRequestID': checkoutRequestID
   });
   
   // Fallback: if none, find most recent pending payment (MVP)
   if (!payment) {
     const pending = await Payment.findOne({ status: 'pending' })
       .sort({ createdAt: -1 });
     if (pending) {
       payment = pending;
     }
   }
   ```
   - **⚠️ CRITICAL ISSUE:** The fallback could match the wrong payment if multiple payments are pending
   - Should always match by `CheckoutRequestID` only

4. **Handle Payment Result**:

   **If `resultCode === 0` (Success):**

   a. **Update Payment Status** (lines 149-151):
      ```javascript
      payment.status = 'success';
      payment.providerPayload = stkCallback;
      await payment.save();
      ```

   b. **Extract Package Key** (lines 163-167):
      ```javascript
      let packageKey = payment.providerPayload && payment.providerPayload.packageKey;
      if (!packageKey) {
        // as a fallback pick a default simple package (TODO in production)
        packageKey = 'kumi-net';
      }
      ```
      - **⚠️ CRITICAL ISSUE:** `packageKey` is never stored in payment record
      - Falls back to hardcoded `'kumi-net'` which is wrong
      - Should retrieve from logs (line 176) or store in payment

   c. **Find Package** (line 168):
      ```javascript
      const pkg = await Package.findOne({ key: packageKey });
      ```

   d. **Retrieve MAC & IP from Logs** (line 176):
      ```javascript
      const lastLog = await LogModel.findOne({
        'metadata.paymentId': payment._id
      }).sort({ createdAt: -1 });
      const { mac, ip } = (lastLog && lastLog.metadata) 
        ? { mac: lastLog.metadata.mac, ip: lastLog.metadata.ip } 
        : { mac: null, ip: null };
      ```
      - **⚠️ ISSUE:** Relies on logs to find device info
      - Should be stored in payment record or separate pending checkout table

   e. **Create Subscription** (line 182):
      ```javascript
      const now = new Date();
      const endAt = new Date(now.getTime() + pkg.durationSeconds * 1000);
      const sub = await Subscription.create({
        userId: payment.userId || null,
        packageKey: pkg.key,
        devices: mac ? [{ mac }] : [],
        startAt: now,
        endAt,
        active: true,
        paymentId: payment._id
      });
      ```

   f. **Grant MikroTik Access** (lines 187-192):
      ```javascript
      if (mac) {
        await grantAccess({
          mac,
          ip,
          comment: `payment:${payment._id}`,
          until: endAt
        });
        sub.mikrotikEntry = { type: 'ip-binding', mac, ip, until: endAt };
        await sub.save();
      }
      ```

   **If `resultCode !== 0` (Failed):**
   - Updates payment status to `failed`
   - Logs failure
   - Returns error response

---

## 🔍 Key Issues Identified

### **1. Package Key Not Stored in Payment Record**

**Problem:**
- `packageKey` is not stored in the payment record when checkout starts
- Callback tries to find it from `payment.providerPayload.packageKey` (which doesn't exist)
- Falls back to hardcoded `'kumi-net'` which is incorrect

**Impact:**
- Wrong package might be assigned if callback can't find packageKey
- User might get different package than they paid for

**Fix Needed:**
- Store `packageKey` in payment record when creating payment
- Or store it in `accountRef` in a parseable format

---

### **2. Device Info (MAC/IP) Not Stored in Payment**

**Problem:**
- MAC and IP are stored in logs, not in payment record
- Callback retrieves them from logs by searching for `paymentId`
- This is brittle and could fail if logs are cleared or not found

**Impact:**
- If log lookup fails, subscription is created without device binding
- User won't get automatic access granted

**Fix Needed:**
- Store `mac` and `ip` directly in payment record
- Or create a `PendingCheckout` model to store checkout context

---

### **3. Payment Lookup Fallback is Dangerous**

**Problem:**
- If payment lookup by `CheckoutRequestID` fails, it falls back to most recent pending payment
- This could match the wrong payment if multiple payments are pending

**Impact:**
- Wrong payment could be marked as successful
- Wrong subscription could be created
- User could get access for wrong package

**Fix Needed:**
- Remove fallback or make it more robust
- Always require `CheckoutRequestID` match
- Log warning if payment not found and don't proceed

---

### **4. No Validation of Callback Data**

**Problem:**
- Callback doesn't validate that the amount matches
- Doesn't verify the phone number matches
- No signature verification (if Daraja provides it)

**Impact:**
- Could process fraudulent callbacks
- Could process wrong amounts

**Fix Needed:**
- Validate amount matches payment record
- Validate phone number matches
- Implement callback signature verification if available

---

### **5. Error Handling Could Be Better**

**Problem:**
- If package lookup fails, just logs and returns
- If subscription creation fails, no rollback
- If MikroTik access grant fails, subscription still created

**Impact:**
- Payment marked as successful but user doesn't get access
- Inconsistent state between payment, subscription, and router

**Fix Needed:**
- Better error handling and rollback
- Retry logic for MikroTik operations
- Transaction-like behavior for critical operations

---

## 📊 Data Flow Diagram

```
Frontend
  │
  ├─> POST /api/checkout/start
  │     { phone, packageKey, mac, ip, userId }
  │
  │
Backend (checkout.js)
  │
  ├─> 1. Validate input
  ├─> 2. Create Payment (status: pending)
  ├─> 3. Log checkout start (with context)
  ├─> 4. Call Daraja stkPush()
  │     │
  │     └─> Daraja API
  │           │
  │           └─> STK Push to User's Phone
  │
  ├─> 5. Save STK response to payment.providerPayload
  └─> 6. Return CheckoutRequestID to frontend
        │
        │
User's Phone
  │
  ├─> User receives STK push
  ├─> User enters PIN
  └─> User approves payment
        │
        │
Daraja Processes Payment
  │
  └─> POST /api/checkout/daraja-callback
        │
        │
Backend (checkout.js callback handler)
  │
  ├─> 1. Extract CheckoutRequestID
  ├─> 2. Find Payment by CheckoutRequestID
  ├─> 3. Check ResultCode
  │     │
  │     ├─> If Success (ResultCode === 0):
  │     │     │
  │     │     ├─> Update payment.status = 'success'
  │     │     ├─> Find packageKey (from logs/fallback)
  │     │     ├─> Find mac/ip (from logs)
  │     │     ├─> Create Subscription
  │     │     └─> Grant MikroTik Access
  │     │
  │     └─> If Failed (ResultCode !== 0):
  │           └─> Update payment.status = 'failed'
  │
  └─> Return response to Daraja
```

---

## 🔧 Recommended Fixes

### **Fix 1: Store Package Key in Payment**

```javascript
// In checkout/start route
const payment = await Payment.create({
  userId: userId || null,
  amountKES: pkg.priceKES,
  provider: 'daraja',
  status: 'pending',
  packageKey: packageKey,  // ADD THIS
  mac: mac || null,        // ADD THIS
  ip: ip || null           // ADD THIS
});
```

### **Fix 2: Update Payment Model**

```javascript
const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountKES: { type: Number },
  provider: { type: String },
  providerPayload: { type: Object },
  status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
  packageKey: { type: String },  // ADD THIS
  mac: { type: String },         // ADD THIS
  ip: { type: String },          // ADD THIS
  createdAt: { type: Date, default: Date.now }
});
```

### **Fix 3: Improve Callback Handler**

```javascript
// In daraja-callback route
if (resultCode === 0) {
  payment.status = 'success';
  payment.providerPayload = stkCallback;
  await payment.save();

  // Use stored packageKey instead of fallback
  const packageKey = payment.packageKey;
  if (!packageKey) {
    await LogModel.create({
      level: 'error',
      source: 'daraja-callback',
      message: 'packageKey-missing',
      metadata: { paymentId: payment._id }
    });
    return res.status(200).send('package key missing');
  }

  const pkg = await Package.findOne({ key: packageKey });
  if (!pkg) {
    await LogModel.create({
      level: 'error',
      source: 'daraja-callback',
      message: 'package-not-found',
      metadata: { packageKey, paymentId: payment._id }
    });
    return res.status(200).send('package not found');
  }

  // Use stored mac/ip instead of logs
  const mac = payment.mac;
  const ip = payment.ip;

  // Rest of the flow...
}
```

### **Fix 4: Remove Dangerous Fallback**

```javascript
// Remove this fallback:
if (!payment) {
  const pending = await Payment.findOne({ status: 'pending' })
    .sort({ createdAt: -1 });
  if (pending) {
    payment = pending;
  }
}

// Replace with:
if (!payment) {
  await LogModel.create({
    level: 'warn',
    source: 'daraja-callback',
    message: 'payment-not-found',
    metadata: { checkoutRequestID }
  });
  return res.status(200).send('payment not found');
}
```

---

## 📝 Summary

The payment system works but has several critical issues:

1. ✅ **Payment initiation works** - STK push is sent correctly
2. ✅ **Callback is received** - Daraja sends callback to endpoint
3. ⚠️ **Package key retrieval is broken** - Falls back to wrong package
4. ⚠️ **Device info retrieval is brittle** - Relies on logs
5. ⚠️ **Payment lookup has dangerous fallback** - Could match wrong payment
6. ⚠️ **No validation** - Doesn't verify amounts or phone numbers

**Priority Fixes:**
1. Store `packageKey`, `mac`, and `ip` in payment record
2. Remove dangerous fallback in payment lookup
3. Add validation for callback data
4. Improve error handling and rollback

---

**Last Updated:** December 2024  
**Status:** Needs fixes before production use

