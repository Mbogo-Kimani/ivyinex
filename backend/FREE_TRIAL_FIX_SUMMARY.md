# Free Trial Internet Access Fix Summary

## Issues Identified

### 1. Environment Variable Mismatch
**Problem**: Error logging in `backend/routes/mikrotik.js` was using incorrect environment variable names:
- Used: `MIKROTIK_HOST`, `MIKROTIK_PORT`, `MIKROTIK_USER`
- Should be: `MI_HOST`, `MI_API_PORT`, `MI_API_USER`

**Impact**: MikroTik connection errors were not being logged properly, making debugging impossible.

**Fix**: Updated error logging to use correct environment variable names.

### 2. Inconsistent Subscription Lookup Patterns
**Problem**: The system has two different ways of looking up active subscriptions:
- Device-based lookup: `deviceId: device._id`
- MAC-based lookup: `'devices.mac': mac`

**Impact**: Device-based free trials created subscriptions with `deviceId` but the auto-reconnection logic looks for subscriptions by MAC address in the `devices` array.

**Fix**: Updated device-based free trial to populate the `devices` array with the device MAC address.

## Changes Made

### 1. Fixed Environment Variable References
**File**: `backend/routes/mikrotik.js`
- Lines 430-433: Updated error logging to use correct env vars
- Lines 448-451: Updated error metadata to use correct env vars

### 2. Fixed Subscription Device Array
**File**: `backend/routes/mikrotik.js`
- Line 468: Added `label: 'Free Trial Device'` to devices array
- This ensures the subscription can be found by MAC address lookup

### 3. Created Test Script
**File**: `backend/test-mikrotik.js`
- Test script to verify MikroTik connection
- Provides detailed error analysis
- Can be run locally to test connection

## Expected Results

After these fixes:
1. **Better Error Logging**: MikroTik connection errors will be properly logged with correct environment variable values
2. **Consistent Lookup**: Device-based free trials will be found by both device ID and MAC address lookups
3. **Auto-Reconnection**: Devices with free trial subscriptions should automatically reconnect when they access the portal

## Testing

To test the fixes:
1. Deploy the updated backend
2. Try to claim a free trial from a mobile device
3. Check the logs for proper MikroTik connection attempts
4. Verify that the device gets internet access

## Environment Variables Required

Make sure these are set in your deployment:
- `MI_HOST`: 100.122.97.19
- `MI_API_USER`: kim_admin
- `MI_API_PASS`: @Newkim2025.
- `MI_API_PORT`: 8728
- `MI_USE_SSL`: false
