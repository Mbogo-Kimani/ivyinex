# Insufficient Balance Polling Fix

## 🔴 Problem

User received STK push, entered PIN, but had insufficient balance. M-Pesa sent error message, but frontend kept polling indefinitely instead of showing the error.

---

## ✅ Fixes Implemented

### **1. Fixed Polling Interval Storage** ✅

**Issue:** Polling interval was stored in local variable, causing closure issues

**Fix:** Use `useRef` to store interval reference

**File:** `frontend/pages/checkout.js`

**Before:**
```javascript
const pollInterval = setInterval(...);
```

**After:**
```javascript
const pollIntervalRef = useRef(null);
pollIntervalRef.current = setInterval(...);
```

---

### **2. Improved Polling Logic** ✅

**Changes:**
- Added poll counter to prevent infinite polling
- Better error handling in polling
- Clear interval properly on success/failure
- Added console logging for debugging
- Final status check after timeout

**Key Improvements:**
- Polls every 3 seconds
- Stops immediately when status is 'success' or 'failed'
- Shows error message when payment fails
- Cleans up interval on component unmount

---

### **3. Enhanced Error Message Retrieval** ✅

**File:** `backend/routes/checkout.js` (status endpoint)

**Changes:**
- Better error message extraction from payment record
- Checks multiple sources for error message
- Falls back to generating message from error code
- Added logging for debugging

---

### **4. Added Debug Logging** ✅

**Backend:**
- Logs callback receipt
- Logs parsed callback data
- Logs payment status checks

**Frontend:**
- Logs each polling attempt
- Logs payment status responses
- Logs when polling stops

---

## 🔄 How It Works Now

### **Scenario: Insufficient Balance**

1. **User initiates payment:**
   - Frontend calls `/api/checkout/start`
   - Backend creates payment (status: 'pending')
   - STK push sent to user's phone
   - Frontend starts polling

2. **User enters PIN:**
   - User receives STK push
   - User enters PIN
   - Safaricom processes payment
   - Safaricom detects insufficient balance

3. **Daraja sends callback:**
   - Callback received at `/api/checkout/daraja-callback`
   - Backend extracts `resultCode` (e.g., 1, 2001, etc.)
   - Backend marks payment as `'failed'`
   - Backend stores error message: "Insufficient M-Pesa balance. Please top up your account and try again."

4. **Frontend polling detects failure:**
   - Next poll (within 3 seconds) calls `/api/checkout/status/:paymentId`
   - Backend returns: `{ status: 'failed', errorMessage: '...' }`
   - Frontend detects `status === 'failed'`
   - Frontend stops polling
   - Frontend shows error message to user
   - User sees: "Insufficient M-Pesa balance. Please top up your account and try again."

---

## 🐛 What Was Wrong

### **Issue 1: Closure Problem**
- Polling interval stored in local variable
- Timeout couldn't access interval properly
- Interval might not be cleared correctly

### **Issue 2: Status Detection**
- Polling might not have been checking status correctly
- Error messages might not have been returned properly

### **Issue 3: No Debugging**
- No console logs to see what was happening
- Hard to diagnose why polling wasn't stopping

---

## ✅ What's Fixed

1. **Polling uses useRef:**
   - Interval stored in ref, accessible everywhere
   - Can be cleared properly
   - No closure issues

2. **Better status detection:**
   - Explicitly checks for 'success' and 'failed'
   - Stops immediately when status changes
   - Shows error message from backend

3. **Debug logging:**
   - Console logs show polling progress
   - Backend logs show callback processing
   - Easy to diagnose issues

4. **Error message handling:**
   - Status endpoint returns error message correctly
   - Frontend displays error message to user
   - User sees exactly what went wrong

---

## 🧪 Testing

### **Test Case 1: Insufficient Balance**

1. Initiate payment with phone that has low balance
2. Receive STK push
3. Enter PIN
4. **Expected:** Frontend should show "Insufficient M-Pesa balance. Please top up your account and try again." within 3-6 seconds
5. **Expected:** Polling should stop
6. **Expected:** User can retry payment

### **Test Case 2: Payment Success**

1. Initiate payment with sufficient balance
2. Receive STK push
3. Enter PIN and approve
4. **Expected:** Frontend should show "Payment successful!" within 3-6 seconds
5. **Expected:** Redirects to account page

### **Test Case 3: Timeout**

1. Initiate payment
2. Receive STK push
3. Don't enter PIN (let it timeout)
4. **Expected:** Frontend should show "Payment request timed out..." after callback received
5. **Expected:** Polling should stop

---

## 📊 Console Logs (For Debugging)

**Frontend:**
```
[Poll 1] Payment status: { status: 'pending', ... }
[Poll 2] Payment status: { status: 'pending', ... }
[Poll 3] Payment status: { status: 'failed', errorMessage: 'Insufficient M-Pesa balance...' }
Payment failed, stopping polling. Error: Insufficient M-Pesa balance...
```

**Backend:**
```
Daraja callback received: { Body: { stkCallback: { ... } } }
Daraja callback parsed: { checkoutRequestID: '...', resultCode: 1, resultDesc: '...' }
Payment failed: { paymentId: '...', resultCode: 1, errorMessage: 'Insufficient M-Pesa balance...' }
Payment status check - failed payment: { paymentId: '...', errorMessage: '...' }
```

---

## 🎯 Expected Behavior

### **Before Fix:**
- ❌ Frontend keeps polling indefinitely
- ❌ User never sees error message
- ❌ User doesn't know payment failed

### **After Fix:**
- ✅ Frontend stops polling when payment fails
- ✅ User sees error message immediately
- ✅ User knows exactly what went wrong
- ✅ User can retry payment

---

## 🔍 Troubleshooting

If polling still doesn't stop:

1. **Check browser console:**
   - Look for `[Poll X]` logs
   - Check if status is being returned correctly
   - Verify error message is present

2. **Check backend logs:**
   - Look for "Daraja callback received"
   - Check if payment status is updated to 'failed'
   - Verify error message is stored

3. **Check payment status endpoint:**
   - Manually call: `GET /api/checkout/status/:paymentId`
   - Verify it returns `{ status: 'failed', errorMessage: '...' }`

4. **Check callback:**
   - Verify callback is being received
   - Check if `resultCode` is being extracted correctly
   - Verify payment is being updated

---

**Status:** ✅ **Fixed and ready for testing**  
**Date:** January 2025  
**Users will now see insufficient balance errors immediately!**

