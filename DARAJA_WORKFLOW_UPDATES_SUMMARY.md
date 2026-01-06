# Daraja Payment Workflow - Complete Updates Summary

## 📋 Overview

This document summarizes all updates made to the Daraja (M-Pesa STK Push) payment workflow to improve reliability, error handling, and user experience.

---

## 🎯 Key Improvements

1. **Robust Payment Context Storage** - Store all necessary data in payment record
2. **Enhanced Error Handling** - User-friendly error messages for all failure scenarios
3. **Real-time Payment Status** - Frontend polling with immediate error detection
4. **Improved Payment Lookup** - Multiple fallback methods for callback matching
5. **Better Logging & Debugging** - Comprehensive logging for troubleshooting
6. **Test Endpoints** - Manual payment processing for testing

---

## 📦 1. Payment Model Updates

### **File:** `backend/models/Payment.js`

### **Changes:**
Added fields to store payment context directly in the payment record:

```javascript
const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountKES: { type: Number },
  provider: { type: String }, // 'daraja'
  providerPayload: { type: Object }, // raw callback / response
  status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
  
  // ✅ NEW: Store payment context for callback processing
  packageKey: { type: String }, // Store package key for callback
  phone: { type: String },      // Store phone for validation
  mac: { type: String },        // Store MAC for device binding
  ip: { type: String },         // Store IP for device binding
  
  createdAt: { type: Date, default: Date.now }
});
```

### **Why:**
- Eliminates reliance on logs for payment context
- Makes callback processing self-contained
- Prevents payment matching errors

---

## 🔄 2. Checkout Start Endpoint Updates

### **File:** `backend/routes/checkout.js` - `POST /api/checkout/start`

### **Changes:**

**Before:**
```javascript
const payment = await Payment.create({
  userId: userId || null,
  amountKES: pkg.priceKES,
  provider: 'daraja',
  status: 'pending'
});
```

**After:**
```javascript
// ✅ Store all context needed for callback
const payment = await Payment.create({
  userId: userId || null,
  amountKES: pkg.priceKES,
  provider: 'daraja',
  status: 'pending',
  packageKey: packageKey, // Store package key for callback
  phone: phone, // Store phone for validation
  mac: mac || null, // Store MAC for device binding
  ip: ip || null // Store IP for device binding
});
```

### **Benefits:**
- Callback has all context it needs
- No need to search logs for package/device info
- More reliable payment processing

---

## 📞 3. Callback Handler Improvements

### **File:** `backend/routes/checkout.js` - `POST /api/checkout/daraja-callback`

### **Key Changes:**

#### **A. Enhanced Payment Lookup** ✅

**Before:**
```javascript
const payment = await Payment.findOne({ 
  'providerPayload.CheckoutRequestID': checkoutRequestID 
});
if (!payment) {
  return res.status(200).send('payment not found');
}
```

**After:**
```javascript
// Primary: Find by CheckoutRequestID
let payment = await Payment.findOne({ 
  'providerPayload.CheckoutRequestID': checkoutRequestID 
});

// Fallback 1: Find by account reference (hotspot_<paymentId>)
if (!payment && stkCallback.CallbackMetadata?.Item) {
  const accountRefItem = stkCallback.CallbackMetadata.Item.find(
    i => i.Name === 'AccountReference'
  );
  if (accountRefItem?.Value) {
    const accountRef = accountRefItem.Value;
    if (accountRef.startsWith('hotspot_')) {
      const paymentIdFromRef = accountRef.replace('hotspot_', '');
      payment = await Payment.findById(paymentIdFromRef);
    }
  }
}

// Fallback 2: Find most recent pending payment (last 10 minutes)
if (!payment) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  payment = await Payment.findOne({
    status: 'pending',
    createdAt: { $gte: tenMinutesAgo }
  }).sort({ createdAt: -1 });
}
```

#### **B. Improved Error Message Storage** ✅

**Before:**
```javascript
payment.status = 'failed';
payment.providerPayload = {
  ...stkCallback,
  failedAt: new Date()
};
```

**After:**
```javascript
// Get user-friendly error message
const errorMessage = getErrorMessage(resultCode, resultDesc);

payment.status = 'failed';
payment.providerPayload = {
  ...stkCallback,
  failedAt: new Date(),
  errorMessage: errorMessage, // ✅ Store user-friendly message
  errorCode: resultCode
};
```

#### **C. Enhanced Logging** ✅

**Added:**
- Full callback body logging (first 1000 chars)
- Request headers logging
- Callback parsing details
- Payment lookup attempts

```javascript
logger.info('Daraja callback received - FULL', { 
  body: callbackLog.substring(0, 1000),
  headers: req.headers,
  method: req.method,
  url: req.url
});
```

---

## 📊 4. Payment Status Endpoint

### **File:** `backend/routes/checkout.js` - `GET /api/checkout/status/:paymentId`

### **New Endpoint Added:**

```javascript
router.get('/status/:paymentId', async (req, res) => {
  const payment = await Payment.findById(paymentId);
  
  // Get user-friendly error message if payment failed
  let errorMessage = null;
  if (payment.status === 'failed' && payment.providerPayload) {
    const errorCode = payment.providerPayload.ResultCode || 
                     payment.providerPayload.errorCode;
    
    // Check if errorMessage is already stored (from callback)
    if (payment.providerPayload.errorMessage) {
      errorMessage = payment.providerPayload.errorMessage;
    } else if (errorCode) {
      // Generate error message from result code
      errorMessage = getErrorMessage(errorCode, 
        payment.providerPayload.ResultDesc);
    }
  }
  
  // Check if subscription was created
  let subscription = null;
  if (payment.status === 'success') {
    subscription = await Subscription.findOne({ 
      paymentId: payment._id 
    });
  }
  
  res.json({
    status: payment.status,
    amountKES: payment.amountKES,
    packageKey: payment.packageKey,
    phone: payment.phone,
    errorMessage: errorMessage,
    errorCode: errorCode,
    subscriptionId: subscription?._id || null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  });
});
```

### **Purpose:**
- Allows frontend to poll payment status
- Returns user-friendly error messages
- Provides subscription information

---

## 🎨 5. Frontend Polling Mechanism

### **File:** `frontend/pages/checkout.js`

### **Key Changes:**

#### **A. Payment Status API Function** ✅

**File:** `frontend/lib/api.js`

**Added:**
```javascript
export async function checkPaymentStatus(paymentId) {
    const res = await fetch(`/api/checkout/status/${paymentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check payment status');
    return data;
}
```

#### **B. Polling Implementation** ✅

**Features:**
- Polls every 3 seconds
- Uses `useRef` for interval storage (prevents closure issues)
- Stops immediately on success/failure
- Shows error messages to user
- Timeout after 5 minutes
- Cleanup on component unmount

```javascript
const pollIntervalRef = useRef(null);

const startPaymentPolling = (paymentId) => {
    setPolling(true);
    setPaymentError(null);
    
    let pollCount = 0;
    const maxPolls = 100; // 5 minutes at 3 seconds each
    
    pollIntervalRef.current = setInterval(async () => {
        pollCount++;
        
        try {
            const status = await api.checkPaymentStatus(paymentId);
            setPaymentStatus(status);
            
            if (status.status === 'success') {
                clearInterval(pollIntervalRef.current);
                setPolling(false);
                showSuccess('Payment successful!');
                setTimeout(() => router.push('/account'), 2000);
                return;
            } 
            else if (status.status === 'failed') {
                clearInterval(pollIntervalRef.current);
                setPolling(false);
                const errorMsg = status.errorMessage || 
                              'Payment failed. Please try again.';
                setPaymentError(errorMsg);
                showError(errorMsg);
                return;
            }
        } catch (err) {
            console.error('Payment status check error:', err);
            if (pollCount >= maxPolls) {
                clearInterval(pollIntervalRef.current);
                setPolling(false);
                setPaymentError('Payment status check failed.');
            }
        }
    }, 3000);
    
    // Timeout after 5 minutes
    setTimeout(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            // Final status check...
        }
    }, 300000);
};
```

---

## ⚠️ 6. Error Message Mapping

### **File:** `backend/routes/checkout.js` - `getErrorMessage()`

### **Function Added:**

```javascript
function getErrorMessage(resultCode, resultDesc) {
  const errorMessages = {
    0: 'Payment successful',
    1: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    1032: 'Payment was cancelled. Please try again.',
    1037: 'Payment request timed out. Please ensure your phone is online and try again.',
    1019: 'Transaction expired. Please initiate a new payment.',
    17: 'You cancelled the payment. Please try again.',
    2001: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    2002: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    2003: 'Insufficient M-Pesa balance. Please top up your account and try again.'
  };
  
  if (errorMessages[resultCode]) {
    return errorMessages[resultCode];
  }
  
  if (resultDesc && resultDesc !== 'OK' && 
      resultDesc !== 'The service request is processed successfully.') {
    return resultDesc;
  }
  
  return 'Payment failed. Please try again.';
}
```

### **Purpose:**
- Converts Daraja error codes to user-friendly messages
- Handles all common error scenarios
- Provides fallback messages

---

## 🧪 7. Test Endpoints

### **File:** `backend/routes/checkout.js`

### **A. Test Callback Endpoint** ✅

**Endpoint:** `GET /api/checkout/test-callback`

**Purpose:** Verify callback URL is accessible

**Response:**
```json
{
  "status": "ok",
  "message": "Callback endpoint is accessible",
  "timestamp": "2026-01-06T...",
  "path": "/api/checkout/daraja-callback"
}
```

### **B. Test Callback Processing** ✅

**Endpoint:** `POST /api/checkout/test-callback`

**Purpose:** Manually simulate callback for testing

**Request:**
```json
{
  "paymentId": "payment-id-here",
  "resultCode": 1,
  "resultDesc": "Insufficient balance"
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Test callback processed",
  "paymentId": "...",
  "paymentStatus": "failed",
  "errorMessage": "Insufficient M-Pesa balance..."
}
```

### **C. Pending Payments Endpoint** ✅

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
      "createdAt": "2026-01-06T...",
      "checkoutRequestID": "ws_CO_...",
      "ageMinutes": 5
    }
  ]
}
```

---

## 🔧 8. Daraja Library Improvements

### **File:** `backend/lib/daraja.js`

### **Changes:**

#### **A. Enhanced Error Handling** ✅

**Added user-friendly error messages for merchant errors:**

```javascript
if (res.data.errorCode || res.data.errorMessage) {
  const errorCode = res.data.errorCode;
  const errorMessage = res.data.errorMessage;
  
  let friendlyMessage = errorMessage;
  if (errorCode === '500.001.1001' || 
      errorMessage?.includes('Merchant does not exist')) {
    friendlyMessage = 'Merchant configuration error: The shortcode or passkey is incorrect.';
  }
  
  throw new Error(`STK push failed: ${friendlyMessage} (Code: ${errorCode})`);
}
```

#### **B. Configuration Validation** ✅

**Added logging for configuration:**

```javascript
logger.info('Daraja configuration loaded', {
  baseUrl,
  shortcode: shortcode ? `${shortcode.substring(0, 3)}***` : 'NOT SET',
  hasConsumerKey: !!consumerKey,
  hasConsumerSecret: !!consumerSecret,
  hasPasskey: !!passkey,
  callbackUrl: callbackUrl ? 'SET' : 'NOT SET'
});
```

---

## 📝 9. Complete Payment Flow (Updated)

### **Step 1: User Initiates Payment**
1. Frontend calls `POST /api/checkout/start`
2. Backend creates payment with **all context** (packageKey, phone, mac, ip)
3. Backend initiates STK push via Daraja
4. Frontend receives `paymentId` and starts polling

### **Step 2: User Completes Payment**
1. User receives STK push on phone
2. User enters PIN
3. Safaricom processes payment

### **Step 3: Daraja Sends Callback**
1. Daraja POSTs callback to `/api/checkout/daraja-callback`
2. Backend logs full callback for debugging
3. Backend finds payment using:
   - Primary: CheckoutRequestID
   - Fallback 1: Account reference
   - Fallback 2: Most recent pending payment
4. Backend processes result:
   - **Success (resultCode === 0):**
     - Validates amount and phone
     - Creates subscription
     - Grants MikroTik access
     - Marks payment as 'success'
   - **Failure (resultCode !== 0):**
     - Gets user-friendly error message
     - Marks payment as 'failed'
     - Stores error message and code

### **Step 4: Frontend Polling**
1. Frontend polls `GET /api/checkout/status/:paymentId` every 3 seconds
2. Backend returns payment status and error message
3. Frontend detects status change:
   - **Success:** Shows success message, redirects to account
   - **Failed:** Shows error message, stops polling
   - **Pending:** Continues polling (max 5 minutes)

---

## ✅ Summary of All Changes

### **Backend Changes:**

1. ✅ **Payment Model** - Added packageKey, phone, mac, ip fields
2. ✅ **Checkout Start** - Store all context in payment record
3. ✅ **Callback Handler** - Enhanced payment lookup with fallbacks
4. ✅ **Error Messages** - User-friendly error message mapping
5. ✅ **Status Endpoint** - New endpoint for payment status polling
6. ✅ **Test Endpoints** - Manual payment processing for testing
7. ✅ **Logging** - Comprehensive callback and error logging
8. ✅ **Daraja Library** - Better error handling and validation

### **Frontend Changes:**

1. ✅ **Payment Status API** - New function to check payment status
2. ✅ **Polling Mechanism** - Real-time payment status checking
3. ✅ **Error Display** - Show user-friendly error messages
4. ✅ **UI Updates** - Loading states and error messages

---

## 🎯 Benefits

1. **Reliability:**
   - Payment context stored in database (not logs)
   - Multiple fallback methods for payment lookup
   - Self-contained callback processing

2. **User Experience:**
   - Real-time payment status updates
   - Clear error messages
   - Immediate feedback on failures

3. **Debugging:**
   - Comprehensive logging
   - Test endpoints for manual processing
   - Pending payments endpoint

4. **Error Handling:**
   - User-friendly error messages
   - Handles all common Daraja error codes
   - Graceful fallbacks

---

## 📋 Testing Checklist

- [x] Payment creation stores all context
- [x] Callback processing with CheckoutRequestID
- [x] Callback processing with account reference fallback
- [x] Callback processing with recent pending fallback
- [x] Error message storage and retrieval
- [x] Frontend polling detects success
- [x] Frontend polling detects failure
- [x] Error messages displayed to user
- [x] Test endpoints work correctly
- [x] Logging captures all necessary information

---

## 🚀 Deployment Notes

### **Required Environment Variables:**
```env
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_SHORTCODE=your_shortcode
DARAJA_PASSKEY=your_passkey
DARAJA_CALLBACK_URL=https://your-backend.onrender.com/api/checkout/daraja-callback
DARAJA_BASE_URL=https://sandbox.safaricom.co.ke  # or https://api.safaricom.co.ke
```

### **Important:**
- ✅ Callback URL must be registered in Daraja portal
- ✅ Callback URL must be HTTPS
- ✅ Callback URL must be publicly accessible
- ✅ Callback URL must match exactly in Daraja portal

---

**Status:** ✅ **All updates complete and tested**  
**Date:** January 2025  
**Ready for production after callback URL registration!**


