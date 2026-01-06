import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as api from '../lib/api';
import Header from '../components/Header';

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [packageData, setPackageData] = useState(null);
    const [userPoints, setUserPoints] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('mpesa'); // 'mpesa' or 'points'
    const [phone, setPhone] = useState('');
    const [mac, setMac] = useState('');
    const [ip, setIp] = useState('');
    const [paymentId, setPaymentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [polling, setPolling] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        // Get package data from query params
        const { packageKey } = router.query;
        if (packageKey) {
            loadPackageData(packageKey);
        }

        // Load user points if authenticated
        if (isAuthenticated) {
            loadUserPoints();
        }

        // Get portal data from session storage
        const portalData = JSON.parse(sessionStorage.getItem('portalData') || '{}');
        if (portalData.mac) setMac(portalData.mac);
        if (portalData.ip) setIp(portalData.ip);
        
        // Cleanup polling on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [router.query, isAuthenticated]);

    const loadPackageData = async (packageKey) => {
        try {
            const packages = await api.fetchPackages();
            const pkg = packages.find(p => p.key === packageKey);
            if (pkg) {
                setPackageData(pkg);
            } else {
                showError('Package not found');
                router.push('/');
            }
        } catch (err) {
            showError('Failed to load package data');
            router.push('/');
        }
    };

    const loadUserPoints = async () => {
        try {
            const response = await api.getUserPoints();
            setUserPoints(response.points);
        } catch (err) {
            console.error('Failed to load user points:', err);
        }
    };

    const startPaymentPolling = (paymentId) => {
        setPolling(true);
        setPaymentError(null);
        setPaymentStatus(null);
        
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        
        let pollCount = 0;
        const maxPolls = 100; // Maximum 100 polls (5 minutes at 3 seconds each)
        
        pollIntervalRef.current = setInterval(async () => {
            pollCount++;
            
            try {
                const status = await api.checkPaymentStatus(paymentId);
                console.log(`[Poll ${pollCount}] Payment status:`, status); // Debug log
                setPaymentStatus(status);
                
                // Check for success
                if (status.status === 'success') {
                    console.log('Payment successful, stopping polling');
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setPolling(false);
                    setLoading(false);
                    showSuccess('Payment successful! Your subscription is now active.');
                    // Redirect to account page after short delay
                    setTimeout(() => {
                        router.push('/account');
                    }, 2000);
                    return;
                } 
                // Check for failure
                else if (status.status === 'failed') {
                    console.log('Payment failed, stopping polling. Error:', status.errorMessage);
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setPolling(false);
                    setLoading(false);
                    const errorMsg = status.errorMessage || 'Payment failed. Please try again.';
                    setPaymentError(errorMsg);
                    showError(errorMsg);
                    return;
                }
                // If still pending, continue polling
                console.log(`[Poll ${pollCount}] Payment still pending, continuing...`);
            } catch (err) {
                console.error(`[Poll ${pollCount}] Payment status check error:`, err);
                // Continue polling even if there's an error (might be temporary)
                // But stop after max polls to prevent infinite polling
                if (pollCount >= maxPolls) {
                    console.log('Max polls reached, stopping');
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setPolling(false);
                    setLoading(false);
                    setPaymentError('Payment status check failed. Please check your payment status in your account.');
                    showError('Payment status check failed. Please check your payment status in your account.');
                }
            }
        }, 3000); // Poll every 3 seconds
        
        // Stop polling after 5 minutes (100 polls * 3 seconds = 300 seconds)
        setTimeout(() => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setPolling(false);
                setLoading(false);
                // Check final status one more time
                api.checkPaymentStatus(paymentId).then(status => {
                    if (status.status === 'failed') {
                        const errorMsg = status.errorMessage || 'Payment failed. Please try again.';
                        setPaymentError(errorMsg);
                        showError(errorMsg);
                    } else if (status.status !== 'success') {
                        setPaymentError('Payment is taking longer than expected. Please check your payment status in your account or try again.');
                        showError('Payment is taking longer than expected. Please check your payment status in your account.');
                    }
                }).catch(err => {
                    console.error('Final payment status check error:', err);
                    setPaymentError('Unable to verify payment status. Please check your account or try again.');
                    showError('Unable to verify payment status. Please check your account or try again.');
                });
            }
        }, 300000); // 5 minutes
    };

    const handlePayment = async () => {
        if (!packageData) return;

        setLoading(true);
        setPaymentError(null);
        setPaymentStatus(null);
        setPaymentId(null);
        
        try {
            if (paymentMethod === 'points') {
                // Use points to purchase
                await api.usePoints({
                    packageKey: packageData.key,
                    mac: mac || null,
                    ip: ip || null
                });
                showSuccess('Package purchased with points successfully!');
                router.push('/account');
            } else {
                // Use MPESA payment
                const response = await api.startCheckout({
                    phone,
                    packageKey: packageData.key,
                    mac: mac || null,
                    ip: ip || null
                });
                
                // Store payment ID and start polling
                setPaymentId(response.paymentId);
                showSuccess('Payment initiated! Please check your phone for STK Push.');
                
                // Start polling for payment status
                startPaymentPolling(response.paymentId);
            }
        } catch (err) {
            showError(err.message || 'Payment failed');
            setPaymentError(err.message || 'Payment failed');
            setLoading(false);
        }
    };

    if (!packageData) {
        return (
            <div className="center" style={{ padding: 40 }}>
                <div>Loading package data...</div>
            </div>
        );
    }

    const canUsePoints = isAuthenticated && packageData.pointsRequired > 0 && userPoints >= packageData.pointsRequired;

    return (
        <>
            <Header />
            <main className="container">
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h1>Checkout</h1>
                    
                    {/* Add CSS for spinner animation */}
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>

                    {/* Package Summary */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3>{packageData.name}</h3>
                        <div className="price">KES {packageData.priceKES}</div>
                        <div className="meta">
                            Duration: {Math.round(packageData.durationSeconds / 3600)} hours
                            • Speed: {Math.round(packageData.speedKbps / 1000 * 10) / 10} Mbps
                            • Devices: {packageData.devicesAllowed}
                        </div>
                        {packageData.pointsRequired > 0 && (
                            <div className="meta" style={{ color: '#10b981', marginTop: 8 }}>
                                Points Required: {packageData.pointsRequired}
                                {packageData.pointsEarned > 0 && (
                                    <span> • Earn {packageData.pointsEarned} points</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="card">
                        <h3>Payment Method</h3>

                        <div style={{ marginBottom: 16 }}>
                            <label>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="mpesa"
                                    checked={paymentMethod === 'mpesa'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <span style={{ marginLeft: 8 }}>MPESA</span>
                            </label>
                        </div>

                        {packageData.pointsRequired > 0 && isAuthenticated && (
                            <div style={{ marginBottom: 16 }}>
                                <label>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="points"
                                        checked={paymentMethod === 'points'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={!canUsePoints}
                                    />
                                    <span style={{ marginLeft: 8 }}>
                                        Use Points ({userPoints} available)
                                        {!canUsePoints && (
                                            <span style={{ color: '#dc2626', fontSize: 12 }}>
                                                {' '}• Insufficient points
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* MPESA Phone Input */}
                        {paymentMethod === 'mpesa' && (
                            <div style={{ marginTop: 16 }}>
                                <label>Phone Number</label>
                                <input
                                    className="input"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="254712345678"
                                />
                            </div>
                        )}

                        {/* Device Information */}
                        <div style={{ marginTop: 16 }}>
                            <label>Device MAC Address (Optional)</label>
                            <input
                                className="input"
                                value={mac}
                                onChange={(e) => setMac(e.target.value)}
                                placeholder="AA:BB:CC:DD:EE:FF"
                            />
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <label>Device IP Address (Optional)</label>
                            <input
                                className="input"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                placeholder="192.168.88.101"
                            />
                        </div>

                        {/* Payment Status Display */}
                        {polling && (
                            <div style={{
                                marginTop: 16,
                                padding: 16,
                                background: 'rgba(33, 175, 233, 0.1)',
                                borderRadius: 8,
                                border: '1px solid rgba(47, 231, 245, 0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 20,
                                        height: 20,
                                        border: '3px solid var(--wifi-mtaani-accent)',
                                        borderTop: '3px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <div>
                                        <div style={{ color: 'var(--wifi-mtaani-accent)', fontWeight: 600 }}>
                                            Waiting for payment confirmation...
                                        </div>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 }}>
                                            Please complete the payment on your phone. This may take a few moments.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Error Display */}
                        {paymentError && (
                            <div style={{
                                marginTop: 16,
                                padding: 16,
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 8,
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 4 }}>
                                    Payment Failed
                                </div>
                                <div style={{ color: '#fca5a5', fontSize: 14 }}>
                                    {paymentError}
                                </div>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setPaymentError(null);
                                        setPaymentStatus(null);
                                        setPaymentId(null);
                                        setPolling(false);
                                    }}
                                    style={{
                                        marginTop: 12,
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: 14,
                                        padding: '8px 16px'
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Payment Button */}
                        <div style={{ marginTop: 24 }} className="row">
                            <button
                                className="btn"
                                onClick={handlePayment}
                                disabled={loading || polling || (paymentMethod === 'mpesa' && !phone)}
                                style={{
                                    background: paymentMethod === 'points' ? '#10b981' : 'var(--wifi-mtaani-primary)',
                                    color: 'white',
                                    border: 'none',
                                    opacity: (loading || polling) ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Processing...' : polling ? 'Waiting for payment...' : (
                                    paymentMethod === 'points'
                                        ? `Use ${packageData.pointsRequired} Points`
                                        : `Pay KES ${packageData.priceKES}`
                                )}
                            </button>
                            {!polling && (
                                <button
                                    className="btn ghost"
                                    onClick={() => router.push('/')}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}














