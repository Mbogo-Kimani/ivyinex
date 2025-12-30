import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPortalData } from '../../lib/portalData';
import * as api from '../../lib/api';
import ReconnectButton from '../../components/ReconnectButton';

// Dynamically import FreeTrialStatus to prevent SSR issues
const FreeTrialStatus = dynamic(() => import('../../components/FreeTrialStatus'), {
    ssr: false,
    loading: () => <div className="kv">Loading free trial status...</div>
});

export default function AccountDashboard() {
    const { user, isAuthenticated } = useAuth();
    const { showError } = useToast();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [userPoints, setUserPoints] = useState(0);
    const [referralCode, setReferralCode] = useState('');

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Check for portal data and show free trial option if available
        const portalData = getPortalData();
        if (portalData && isAuthenticated) {
            console.log('Portal data available for free trial:', portalData);
        }

        // Load subscriptions and points for dashboard
        if (isAuthenticated) {
            loadSubscriptions();
            loadUserPoints();
        }
    }, [isAuthenticated]);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await api.getSubscriptions();
            setSubscriptions(data);
        } catch (err) {
            showError('Failed to load subscription data');
            console.error('Subscription load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserPoints = async () => {
        try {
            const response = await api.getUserPoints();
            setUserPoints(response.points);
            setReferralCode(response.referralCode);
        } catch (err) {
            console.error('Failed to load user points:', err);
        }
    };

    const getSubscriptionStatus = (subscription) => {
        const now = new Date();
        const endDate = new Date(subscription.endAt);

        if (subscription.status === 'cancelled') return 'cancelled';
        if (subscription.status === 'pending') return 'pending';
        if (endDate <= now) return 'expired';
        return 'active';
    };

    const activeSubscriptions = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'active');
    const totalDevices = subscriptions.reduce((total, sub) => total + (sub.devices?.length || 0), 0);

    if (!isAuthenticated) {
        return null; // ProtectedRoute will handle redirect
    }

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', padding: 20 }}>
                <div className="container">
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ color: 'var(--brand-2)', fontSize: 32, marginBottom: 8 }}>
                            Welcome back, {user?.name}!
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage your subscriptions and devices
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-1)', marginBottom: 8 }}>
                                {loading ? '...' : activeSubscriptions.length}
                            </div>
                            <div className="kv">Active Subscriptions</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-1)', marginBottom: 8 }}>
                                {loading ? '...' : totalDevices}
                            </div>
                            <div className="kv">Linked Devices</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-1)', marginBottom: 8 }}>
                                {loading ? '...' : user?.freeTrialUsed ? '1' : '0'}
                            </div>
                            <div className="kv">Free Trials Used</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', background: '#f0fdfa', border: '1px solid #10b981' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                                {userPoints}
                            </div>
                            <div className="kv" style={{ color: '#065f46' }}>Points Balance</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            <Link href="/account/subscriptions" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>My Subscriptions</h3>
                                <p className="kv">View and manage your active subscriptions</p>
                            </Link>

                            <Link href="/account/devices" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Device Management</h3>
                                <p className="kv">Add, edit, or remove linked devices</p>
                            </Link>

                            <Link href="/account/profile" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Profile Settings</h3>
                                <p className="kv">Update your personal information</p>
                            </Link>

                            <Link href="/account/settings" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Account Settings</h3>
                                <p className="kv">Manage security and account preferences</p>
                            </Link>

                            <Link href="/" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Browse Packages</h3>
                                <p className="kv">View available internet packages</p>
                            </Link>
                        </div>
                    </div>

                    {/* Reconnect Section */}
                    {activeSubscriptions.length > 0 && (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Connection Issues?</h2>
                            <div className="card" style={{
                                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                border: '1px solid #f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 20
                            }}>
                                <div>
                                    <h3 style={{ color: '#92400e', marginBottom: 8, fontSize: 18 }}>Having trouble connecting?</h3>
                                    <p style={{ color: '#92400e', marginBottom: 0, fontSize: 14 }}>
                                        If your device isn't getting internet access despite having an active subscription,
                                        try reconnecting your device.
                                    </p>
                                </div>
                                <ReconnectButton
                                    onSuccess={() => {
                                        // Optionally refresh subscriptions
                                        loadSubscriptions();
                                    }}
                                    style={{
                                        background: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        minWidth: 160
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Free Trial Section */}
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Free Trial</h2>
                        {loading ? (
                            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                                <div className="kv">Loading free trial status...</div>
                            </div>
                        ) : (() => {
                            const freeTrialSubscription = subscriptions.find(sub =>
                                sub.packageKey === 'free-trial' ||
                                sub.packageName?.toLowerCase().includes('free trial') ||
                                sub.priceKES === 0
                            );

                            if (freeTrialSubscription && isClient) {
                                return (
                                    <div>
                                        <FreeTrialStatus
                                            subscription={freeTrialSubscription}
                                            onRefresh={loadSubscriptions}
                                        />
                                    </div>
                                );
                            } else if (user?.freeTrialUsed) {
                                return (
                                    <div className="card" style={{ textAlign: 'center', padding: 20, background: '#f9fafb' }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                                        <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Free Trial Used</h3>
                                        <p className="kv" style={{ marginBottom: 16 }}>
                                            You've already claimed your free trial. Browse packages to continue!
                                        </p>
                                        <Link href="/" className="btn">
                                            Browse Packages
                                        </Link>
                                    </div>
                                );
                            } else if (isClient) {
                                return (
                                    <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdfa, #ecfccb)', border: '1px solid #a7f3d0' }}>
                                        <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Claim Your Free Trial</h3>
                                        <p className="kv" style={{ marginBottom: 16 }}>
                                            Get 1 day of free internet access. Available for registered users only.
                                        </p>
                                        <Link href="/account/free-trial" className="btn">
                                            Claim Free Trial
                                        </Link>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                                        <div className="kv">Loading free trial status...</div>
                                    </div>
                                );
                            }
                        })()}
                    </div>

                    {/* Referral Section */}
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Referral Program</h2>
                        <div className="card" style={{ background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                            <h3 style={{ color: '#0c4a6e', marginBottom: 12 }}>Earn Points by Referring Friends</h3>
                            <p className="kv" style={{ color: '#0c4a6e', marginBottom: 16 }}>
                                Share your referral code and earn 50 points for each friend who signs up using your link!
                            </p>

                            {referralCode && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#0c4a6e' }}>
                                        Your Referral Code:
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: 12,
                                        background: 'white',
                                        borderRadius: 8,
                                        border: '1px solid #0ea5e9'
                                    }}>
                                        <code style={{
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            color: '#0c4a6e',
                                            flex: 1
                                        }}>
                                            {referralCode}
                                        </code>
                                        <button
                                            className="btn ghost"
                                            onClick={() => {
                                                navigator.clipboard.writeText(referralCode);
                                                alert('Referral code copied to clipboard!');
                                            }}
                                            style={{ fontSize: 12 }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ fontSize: 14, color: '#0c4a6e' }}>
                                <strong>How it works:</strong>
                                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                    <li>Share your referral code with friends</li>
                                    <li>When they sign up using your code, you both get bonus points</li>
                                    <li>You earn 50 points, they get 25 welcome bonus points</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Recent Subscriptions */}
                    <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Recent Subscriptions</h2>
                        {loading ? (
                            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                                <div className="kv">Loading subscriptions...</div>
                            </div>
                        ) : subscriptions.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>No Subscriptions Yet</h3>
                                <p className="kv" style={{ marginBottom: 16 }}>
                                    Start by browsing packages or claiming your free trial!
                                </p>
                                <Link href="/" className="btn">
                                    Browse Packages
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 16 }}>
                                {subscriptions.slice(0, 3).map(subscription => {
                                    const status = getSubscriptionStatus(subscription);
                                    const isActive = status === 'active';

                                    return (
                                        <div key={subscription._id} className="card" style={{
                                            border: isActive ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
                                            background: isActive ? '#f0fdfa' : 'white'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>
                                                        {subscription.packageName || subscription.packageKey}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <span style={{
                                                            color: isActive ? '#10b981' : '#6b7280',
                                                            fontWeight: 600,
                                                            fontSize: 14,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: isActive ? '#10b98120' : '#6b728020'
                                                        }}>
                                                            {isActive ? 'Active' : 'Expired'}
                                                        </span>
                                                        <span className="kv" style={{ fontSize: 14 }}>
                                                            {Math.round(subscription.speedKbps / 1000 * 10) / 10} Mbps
                                                        </span>
                                                        <span className="kv" style={{ fontSize: 14 }}>
                                                            {subscription.devices?.length || 0} devices
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--brand-1)', fontSize: 16 }}>
                                                        KES {subscription.priceKES}
                                                    </div>
                                                    <Link
                                                        href={`/account/subscriptions/${subscription._id}`}
                                                        className="btn ghost"
                                                        style={{ padding: '4px 8px', fontSize: 12, marginTop: 4 }}
                                                    >
                                                        Manage
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {subscriptions.length > 3 && (
                                    <div style={{ textAlign: 'center' }}>
                                        <Link href="/account/subscriptions" className="btn ghost">
                                            View All Subscriptions ({subscriptions.length})
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
