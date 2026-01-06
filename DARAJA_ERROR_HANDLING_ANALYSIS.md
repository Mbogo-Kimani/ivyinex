# Daraja Payment Error Handling Analysis

## 📋 Current State Analysis

This document analyzes how the system handles payment errors and whether users can see them in the frontend.

---

## 🔍 Error Scenarios

### **Scenario 1: User Enters PIN but Has Insufficient Balance**

**What Happens:**
1. User receives STK push on phone
2. User enters M-Pesa PIN
3. Safaricom processes payment
4. Safaricom detects insufficient balance
5. Daraja sends callback with `ResultCode !== 0`

**Daraja Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_...",
      "ResultCode": 1032,  // Insufficient balance error code
      "ResultDesc": "Request cancelled by user" or "Insufficient balance"
    }
  }
}
```

**Backend Handling (Current):**
```javascript
// In backend/routes/checkout.js (lines 368-394)
if (resultCode === 0) {
  // Success handling...
} else {
  // Payment failed - update status and log
  payment.status = 'failed';
  payment.providerPayload = {
    ...stkCallback,
    failedAt: new Date()
  };
  await payment.save();
  await LogModel.create({
    level: 'warn',
    source: 'daraja-callback',
    message: 'payment-failed',
    metadata: {
      paymentId: payment._id,
      resultCode,
      resultDesc,
      packageKey: payment.packageKey
    }
  });
  logger.warn('Payment failed', {
    paymentId: payment._id,
    resultCode,
    resultDesc,
    packageKey: payment.packageKey
  });
  return res.status(200).send('failed');
}
```

**Current Behavior:**
- ✅ Payment status updated to `'failed'`
- ✅ Error logged with `resultCode` and `resultDesc`
- ❌ **User cannot see the error** - no frontend notification
- ❌ **No user-friendly error message** stored

---

### **Scenario 2: User Receives STK Push but Doesn't Enter PIN (Timeout/Cancellation)**

**What Happens:**
1. User receives STK push on phone
2. User ignores it or closes the prompt
3. STK push times out (usually after 2-3 minutes)
4. Daraja sends callback with timeout/cancelled error code

**Daraja Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_...",
      "ResultCode": 1032,  // Request cancelled by user
      "ResultDesc": "Request cancelled by user" or "The service request is timed out"
    }
  }
}
```

**Backend Handling (Current):**
- Same as Scenario 1 - payment marked as `'failed'`
- Error logged but user cannot see it

---

## 📊 Common Daraja Result Codes

| ResultCode | Description | User-Friendly Message |
|------------|-------------|----------------------|
| 0 | Success | Payment successful |
| 1032 | Request cancelled by user | Payment was cancelled. Please try again. |
| 1037 | Timeout | Payment request timed out. Please try again. |
| 2001 | Insufficient balance | Insufficient M-Pesa balance. Please top up and try again. |
| 1 | Invalid request | Payment request was invalid. Please try again. |
| 17 | Customer cancelled | You cancelled the payment. Please try again. |

---

## ❌ Current Limitations

### **1. No Frontend Error Display**

**Problem:**
- Frontend initiates payment and shows: "Payment initiated! Please check your phone for STK Push."
- Frontend then redirects user away
- **No polling mechanism** to check payment status
- **No way for user to see errors** that occur after STK push

**Current Frontend Code:**
```javascript
// frontend/pages/checkout.js (lines 77-88)
await api.startCheckout({
    phone,
    packageKey: packageData.key,
    mac: mac || null,
    ip: ip || null
});
showSuccess('Payment initiated! Please check your phone for STK Push.');
router.push('/');  // Redirects immediately
```

**Issues:**
- User never knows if payment failed
- User never sees error messages
- User might think payment is still processing

---

### **2. No Payment Status Endpoint**

**Problem:**
- Backend doesn't expose an endpoint to check payment status
- Frontend cannot query: "Did my payment succeed or fail?"

**Missing:**
```javascript
// This endpoint doesn't exist:
GET /api/checkout/status/:paymentId
```

---

### **3. No User-Friendly Error Messages**

**Problem:**
- Backend stores raw `resultCode` and `resultDesc`
- No translation to user-friendly messages
- No categorization of error types

---

## 🔧 Recommended Solutions

### **Solution 1: Add Payment Status Endpoint**

**Backend:** `backend/routes/checkout.js`

```javascript
/**
 * GET /api/checkout/status/:paymentId
 * Check payment status
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get user-friendly error message
    let errorMessage = null;
    if (payment.status === 'failed' && payment.providerPayload) {
      const resultCode = payment.providerPayload.ResultCode;
      const resultDesc = payment.providerPayload.ResultDesc;
      errorMessage = getErrorMessage(resultCode, resultDesc);
    }

    res.json({
      status: payment.status,
      amountKES: payment.amountKES,
      packageKey: payment.packageKey,
      errorMessage: errorMessage,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    });
  } catch (err) {
    logger.error('Payment status check error', { err: err.message });
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

function getErrorMessage(resultCode, resultDesc) {
  const errorMessages = {
    1032: 'Payment was cancelled. Please try again.',
    1037: 'Payment request timed out. Please try again.',
    2001: 'Insufficient M-Pesa balance. Please top up and try again.',
    1: 'Payment request was invalid. Please try again.',
    17: 'You cancelled the payment. Please try again.'
  };
  
  return errorMessages[resultCode] || resultDesc || 'Payment failed. Please try again.';
}
```

---

### **Solution 2: Add Frontend Polling**

**Frontend:** `frontend/pages/checkout.js` or new component

```javascript
const [paymentId, setPaymentId] = useState(null);
const [paymentStatus, setPaymentStatus] = useState(null);
const [polling, setPolling] = useState(false);

const handlePayment = async () => {
  setLoading(true);
  try {
    const response = await api.startCheckout({
      phone,
      packageKey: packageData.key,
      mac: mac || null,
      ip: ip || null
    });
    
    setPaymentId(response.paymentId);
    setPolling(true);
    showSuccess('Payment initiated! Please check your phone for STK Push.');
    
    // Start polling for payment status
    startPaymentPolling(response.paymentId);
  } catch (err) {
    showError(err.message || 'Payment failed');
    setLoading(false);
  }
};

const startPaymentPolling = (paymentId) => {
  const pollInterval = setInterval(async () => {
    try {
      const status = await api.checkPaymentStatus(paymentId);
      
      if (status.status === 'success') {
        clearInterval(pollInterval);
        setPolling(false);
        showSuccess('Payment successful! Your subscription is now active.');
        router.push('/account');
      } else if (status.status === 'failed') {
        clearInterval(pollInterval);
        setPolling(false);
        showError(status.errorMessage || 'Payment failed. Please try again.');
        setLoading(false);
      }
      // If still pending, continue polling
    } catch (err) {
      console.error('Payment status check error:', err);
    }
  }, 3000); // Poll every 3 seconds
  
  // Stop polling after 5 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
    setPolling(false);
    if (paymentStatus !== 'success' && paymentStatus !== 'failed') {
      showError('Payment is taking longer than expected. Please check your payment status in your account.');
    }
  }, 300000); // 5 minutes
};
```

---

### **Solution 3: Store User-Friendly Error Messages**

**Backend:** Update callback handler

```javascript
// In daraja-callback route
if (resultCode === 0) {
  // Success handling...
} else {
  // Get user-friendly error message
  const errorMessage = getErrorMessage(resultCode, resultDesc);
  
  payment.status = 'failed';
  payment.providerPayload = {
    ...stkCallback,
    failedAt: new Date(),
    errorMessage: errorMessage,  // Store user-friendly message
    errorCode: resultCode
  };
  await payment.save();
  
  // Rest of error handling...
}
```

---

### **Solution 4: Add Payment History View**

**Frontend:** New page or component

```javascript
// frontend/pages/account/payments.js
export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  
  useEffect(() => {
    loadPayments();
  }, []);
  
  const loadPayments = async () => {
    const data = await api.getPaymentHistory();
    setPayments(data);
  };
  
  return (
    <div>
      <h1>Payment History</h1>
      {payments.map(payment => (
        <div key={payment._id}>
          <div>Amount: KES {payment.amountKES}</div>
          <div>Status: {payment.status}</div>
          {payment.status === 'failed' && payment.errorMessage && (
            <div style={{ color: 'red' }}>
              Error: {payment.errorMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Summary

### **Current State:**
- ✅ Backend correctly handles errors (marks payment as failed)
- ✅ Backend logs errors with details
- ❌ **Users cannot see errors in frontend**
- ❌ **No payment status checking mechanism**
- ❌ **No user-friendly error messages**

### **What Happens Now:**

1. **Insufficient Balance:**
   - Payment marked as `failed` in database
   - Error logged in backend
   - **User never knows** - no notification

2. **Timeout/Cancellation:**
   - Payment marked as `failed` in database
   - Error logged in backend
   - **User never knows** - no notification

### **What Should Happen:**

1. **Insufficient Balance:**
   - Payment marked as `failed`
   - User-friendly error message stored
   - Frontend polls and shows: "Insufficient M-Pesa balance. Please top up and try again."

2. **Timeout/Cancellation:**
   - Payment marked as `failed`
   - User-friendly error message stored
   - Frontend polls and shows: "Payment request timed out. Please try again."

---

## 🎯 Implementation Priority

1. **High Priority:**
   - Add payment status endpoint
   - Add user-friendly error message mapping
   - Add frontend polling mechanism

2. **Medium Priority:**
   - Add payment history view
   - Add retry payment functionality
   - Add payment status notifications

3. **Low Priority:**
   - Add email/SMS notifications for failed payments
   - Add payment analytics dashboard

---

**Status:** ❌ **Users cannot currently see payment errors**  
**Recommendation:** Implement polling mechanism and payment status endpoint


