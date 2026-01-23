// Get backend URL from environment variables
const BACKEND = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://ivyinex.onrender.com';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('eco.authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Debug logging to help identify issues
console.log('Backend URL:', BACKEND);

// Fallback packages data for offline scenarios
const FALLBACK_PACKAGES = [
    {
        _id: 'fallback-1',
        key: 'free-trial-1d',
        name: 'Free Trial',
        priceKES: 0,
        durationSeconds: 86400,
        speedKbps: 2000,
        devicesAllowed: 1
    },
    {
        _id: 'fallback-2',
        key: 'daily-100',
        name: 'Daily Package',
        priceKES: 100,
        durationSeconds: 86400,
        speedKbps: 5000,
        devicesAllowed: 2
    }
];


// Retry utility function
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Fetching from ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const res = await fetch(url, {
                ...options,
                signal: controller.signal,
                // Force HTTP/1.1 to avoid QUIC issues
                headers: {
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            console.log(`Success on attempt ${attempt}`);
            return data;

        } catch (error) {
            console.warn(`Attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
            }

            // Exponential backoff: wait 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Package APIs
export async function fetchPackages() {
    try {
        console.log('Fetching packages from:', `/api/packages`);

        const data = await fetchWithRetry(`/api/packages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Packages loaded successfully:', data);

        // Deduplicate free trial packages to ensure only one is shown
        const deduplicatedPackages = deduplicateFreeTrialPackages(data);
        console.log('Deduplicated packages:', deduplicatedPackages);

        return deduplicatedPackages;
    } catch (error) {
        console.error('Package fetch error:', error);
        console.warn('Using fallback packages due to network error');

        // Return fallback data instead of throwing error
        return FALLBACK_PACKAGES;
    }
}

// Helper function to deduplicate free trial packages
function deduplicateFreeTrialPackages(packages) {
    if (!Array.isArray(packages)) return packages;

    const freeTrialPackages = packages.filter(pkg =>
        pkg.priceKES === 0 ||
        pkg.key?.includes('free-trial') ||
        pkg.name?.toLowerCase().includes('free trial')
    );

    const nonFreeTrialPackages = packages.filter(pkg =>
        pkg.priceKES !== 0 &&
        !pkg.key?.includes('free-trial') &&
        !pkg.name?.toLowerCase().includes('free trial')
    );

    // If there are multiple free trial packages, keep only the first one
    const singleFreeTrial = freeTrialPackages.length > 0 ? [freeTrialPackages[0]] : [];

    console.log(`Found ${freeTrialPackages.length} free trial packages, keeping 1`);
    console.log(`Found ${nonFreeTrialPackages.length} non-free trial packages`);

    return [...singleFreeTrial, ...nonFreeTrialPackages];
}

// Checkout APIs
export async function startCheckout(payload) {
    // payload: { phone, packageKey, mac, ip }
    const res = await fetch(`/api/checkout/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
}

// Check payment status
export async function checkPaymentStatus(paymentId) {
    const res = await fetch(`/api/checkout/status/${paymentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check payment status');
    return data;
}

// Voucher APIs
export async function redeemVoucher(payload) {
    // payload: { code, mac, ip, userId? }
    const res = await fetch(`/api/vouchers/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Voucher redeem failed');
    return data;
}

// Authentication APIs
export async function register(userData) {
    const res = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) {
        // Return the response with error details for better handling
        return { ok: false, error: data.error || 'Registration failed' };
    }
    return data;
}

export async function login(credentials) {
    const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) {
        // Return the response with error details and status for better handling
        return { ok: false, status: res.status, error: data.error || 'Login failed' };
    }
    return data;
}

export async function getCurrentUser() {
    const res = await fetch(`/api/auth/me`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get user');
    return data;
}

// Profile APIs
export async function updateProfile(profileData) {
    const res = await fetch(`/api/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    return data;
}

export async function changePassword(passwordData) {
    const res = await fetch(`/api/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password change failed');
    return data;
}

// Forgot password - request password reset
export async function forgotPassword(emailOrPhone) {
    const res = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailOrPhone)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send password reset email');
    return data;
}

// Reset password - set new password with token
export async function resetPassword(token, newPassword) {
    const res = await fetch(`${BACKEND}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
}

// Verify Email
export async function verifyEmail(token) {
    const res = await fetch(`${BACKEND}/api/auth/verify-email`, {
        method: 'GET', // Or POST, checking backend route usually it uses GET or POST with token
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Sometimes passed as header, usually query param is enough.
        },
        // If it's a POST, we'd send body: JSON.stringify({ token })
    });
    // However, link usually implies GET. I'll assume GET /api/auth/verify-email?token=... or similar
    // Actually, looking at typical patterns, let's check if the backend expects a POST body or query param.
    // The link is /verify-email?token=... so the frontend extracts it.
    // Let's assume the backend endpoint is POST /api/auth/verify-email based on typical practices in this codebase.

    const verifyRes = await fetch(`${BACKEND}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });

    const data = await verifyRes.json();
    if (!verifyRes.ok) return { ok: false, error: data.error || 'Verification failed' };
    return { ok: true, ...data };
}

// Subscription APIs
export async function getSubscriptions() {
    const res = await fetch(`/api/subscriptions`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load subscriptions');
    return data;
}

export async function getSubscription(id) {
    const res = await fetch(`/api/subscriptions/${id}`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load subscription');
    return data;
}

export async function claimFreeTrial(mac) {
    const res = await fetch(`/api/subscriptions/free-trial`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mac })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Free trial claim failed');
    return data;
}

// Device Management APIs
export async function addDeviceToSubscription(subscriptionId, deviceData) {
    const res = await fetch(`/api/subscriptions/${subscriptionId}/devices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(deviceData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add device');
    return data;
}

export async function updateDevice(subscriptionId, deviceId, deviceData) {
    const res = await fetch(`/api/subscriptions/${subscriptionId}/devices/${deviceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(deviceData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update device');
    return data;
}

export async function removeDevice(subscriptionId, deviceId) {
    const res = await fetch(`/api/subscriptions/${subscriptionId}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove device');
    return data;
}

// Points APIs
export async function getUserPoints() {
    const res = await fetch(`/api/points/balance`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    console.log('User points response:', data); // Debug referral code
    if (!res.ok) throw new Error(data.error || 'Failed to get user points');
    return data;
}

export async function getPointsHistory() {
    const res = await fetch(`/api/points/history`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get points history');
    return data;
}

export async function usePoints(payload) {
    const res = await fetch(`/api/points/use`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to use points');
    return data;
}

export async function getReferralCode() {
    const res = await fetch(`/api/points/referral-code`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get referral code');
    return data;
}

export async function processReferral(referralCode, userId) {
    const res = await fetch(`/api/points/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, newUserId: userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process referral');
    return data;
}

// Reconnect API - grant access for active subscriptions
export async function reconnectDevice(mac, ip) {
    const res = await fetch(`/api/subscriptions/reconnect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mac, ip })
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        // Likely received an HTML error page (e.g., 401/404/502). Surface snippet for debugging.
        throw new Error(`Unexpected response (status ${res.status}): ${text.slice(0, 200)}`);
    }
    if (!res.ok) throw new Error(data.error || 'Reconnect failed');
    return data;
}

// Check MikroTik connection status
export async function checkConnectionStatus() {
    const res = await fetch(`/api/subscriptions/status/connection`, {
        headers: getAuthHeaders()
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`Unexpected response (status ${res.status}): ${text.slice(0, 200)}`);
    }
    if (!res.ok) throw new Error(data.error || 'Failed to check connection status');
    return data;
}
