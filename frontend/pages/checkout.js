import { useState, useEffect } from 'react';
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

    const handlePayment = async () => {
        if (!packageData) return;

        setLoading(true);
        try {
            if (paymentMethod === 'points') {
                // Use points to purchase
                await api.usePoints({
                    packageKey: packageData.key,
                    mac: mac || null,
                    ip: ip || null
                });
                showSuccess('Package purchased with points successfully!');
            } else {
                // Use MPESA payment
                await api.startCheckout({
                    phone,
                    packageKey: packageData.key,
                    mac: mac || null,
                    ip: ip || null
                });
                showSuccess('Payment initiated! Please check your phone for STK Push.');
            }

            router.push('/');
        } catch (err) {
            showError(err.message || 'Payment failed');
        } finally {
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

                        {/* Payment Button */}
                        <div style={{ marginTop: 24 }} className="row">
                            <button
                                className="btn"
                                onClick={handlePayment}
                                disabled={loading || (paymentMethod === 'mpesa' && !phone)}
                                style={{
                                    background: paymentMethod === 'points' ? '#10b981' : 'var(--brand-1)',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                {loading ? 'Processing...' : (
                                    paymentMethod === 'points'
                                        ? `Use ${packageData.pointsRequired} Points`
                                        : `Pay KES ${packageData.priceKES}`
                                )}
                            </button>
                            <button
                                className="btn ghost"
                                onClick={() => router.push('/')}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}














