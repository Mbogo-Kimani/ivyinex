import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import FreeTrialClaim from '../../components/FreeTrialClaim';
import FreeTrialStatus from '../../components/FreeTrialStatus';
import * as api from '../../lib/api';

export default function FreeTrialPage() {
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [freeTrialSubscription, setFreeTrialSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showClaimForm, setShowClaimForm] = useState(false);

    useEffect(() => {
        loadFreeTrialData();
    }, []);

    const loadFreeTrialData = async () => {
        try {
            setLoading(true);
            const subscriptions = await api.getSubscriptions();

            // Find free trial subscription (assuming it has a special package key or identifier)
            const freeTrial = subscriptions.find(sub =>
                sub.packageKey === 'free-trial' ||
                sub.packageName?.toLowerCase().includes('free trial') ||
                sub.priceKES === 0
            );

            setFreeTrialSubscription(freeTrial);
        } catch (err) {
            showError('Failed to load free trial data');
            console.error('Free trial load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimSuccess = (response) => {
        setShowClaimForm(false);
        loadFreeTrialData(); // Reload data to show the new subscription
    };

    const handleRefresh = () => {
        loadFreeTrialData();
    };

    const canClaimTrial = user && !user.freeTrialUsed && !freeTrialSubscription;

    if (loading) {
        return (
            <ProtectedRoute>
                <div style={{ minHeight: '100vh', padding: 20 }}>
                    <div className="container">
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                border: '4px solid #e5e7eb',
                                borderTop: '4px solid var(--brand-1)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            <div className="kv">Loading free trial data...</div>
                        </div>
                        <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', padding: 20 }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <Link href="/account" className="btn ghost" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ← Back to Account
                        </Link>
                        <h1 style={{ color: 'var(--brand-2)', fontSize: 32, marginBottom: 8 }}>
                            Free Trial
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Claim and manage your free trial access
                        </p>
                    </div>

                    {/* Free Trial Status or Claim Form */}
                    {freeTrialSubscription ? (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ color: 'var(--brand-2)', fontSize: 24, marginBottom: 16 }}>Your Free Trial</h2>
                            <FreeTrialStatus
                                subscription={freeTrialSubscription}
                                onRefresh={handleRefresh}
                            />
                        </div>
                    ) : canClaimTrial ? (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ color: 'var(--brand-2)', fontSize: 24, marginBottom: 16 }}>Claim Your Free Trial</h2>
                            {showClaimForm ? (
                                <FreeTrialClaim
                                    onSuccess={handleClaimSuccess}
                                    onCancel={() => setShowClaimForm(false)}
                                    showCancel={true}
                                />
                            ) : (
                                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
                                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Ready to Claim Your Free Trial?</h3>
                                    <p className="kv" style={{ marginBottom: 20 }}>
                                        Get 1 day of free internet access. No payment required!
                                    </p>
                                    <button
                                        className="btn"
                                        onClick={() => setShowClaimForm(true)}
                                        style={{ marginRight: 12 }}
                                    >
                                        Claim Free Trial
                                    </button>
                                    <Link href="/" className="btn ghost">
                                        Browse Packages Instead
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ color: 'var(--brand-2)', fontSize: 24, marginBottom: 16 }}>Free Trial Not Available</h2>
                            <div className="card" style={{ textAlign: 'center', padding: 40, background: '#f9fafb' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Free Trial Already Used</h3>
                                <p className="kv" style={{ marginBottom: 20 }}>
                                    You've already claimed your free trial. Browse our packages to continue enjoying internet access!
                                </p>
                                <Link href="/" className="btn">
                                    Browse Packages
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Free Trial Information */}
                    <div className="card" style={{ marginBottom: 32 }}>
                        <h2 style={{ color: 'var(--brand-2)', fontSize: 24, marginBottom: 16 }}>About Free Trials</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    marginTop: 2
                                }}>
                                    1
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>1 Day Duration</h4>
                                    <p className="kv" style={{ fontSize: 14 }}>
                                        Your free trial lasts exactly 24 hours from the time you claim it.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    marginTop: 2
                                }}>
                                    2
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>One Per User</h4>
                                    <p className="kv" style={{ fontSize: 14 }}>
                                        Each user can only claim one free trial. This helps us provide fair access to all users.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    marginTop: 2
                                }}>
                                    3
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>Device Linking</h4>
                                    <p className="kv" style={{ fontSize: 14 }}>
                                        Link one device to your free trial. You can change the device if needed.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    marginTop: 2
                                }}>
                                    4
                                </div>
                                <div>
                                    <h4 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>No Payment Required</h4>
                                    <p className="kv" style={{ fontSize: 14 }}>
                                        Free trials are completely free. No credit card or payment information required.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            <Link href="/account/subscriptions" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>My Subscriptions</h3>
                                <p className="kv">View and manage all your subscriptions</p>
                            </Link>

                            <Link href="/account/devices" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Device Management</h3>
                                <p className="kv">Manage your linked devices</p>
                            </Link>

                            <Link href="/" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Browse Packages</h3>
                                <p className="kv">View available internet packages</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}






















