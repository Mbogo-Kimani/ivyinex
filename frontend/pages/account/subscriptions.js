import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as api from '../../lib/api';
import ReconnectButton from '../../components/ReconnectButton';

export default function SubscriptionsPage() {
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await api.getSubscriptions();
            setSubscriptions(data);
        } catch (err) {
            showError('Failed to load subscriptions');
            console.error('Subscription load error:', err);
        } finally {
            setLoading(false);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'expired': return '#6b7280';
            case 'cancelled': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'expired': return 'Expired';
            case 'cancelled': return 'Cancelled';
            case 'pending': return 'Pending';
            default: return 'Unknown';
        }
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeRemaining = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''} remaining`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        } else {
            return `${minutes}m remaining`;
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        const status = getSubscriptionStatus(sub);
        switch (filter) {
            case 'active': return status === 'active';
            case 'expired': return status === 'expired';
            default: return true;
        }
    });

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
                            <div className="kv">Loading subscriptions...</div>
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
                            My Subscriptions
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage your internet packages and devices
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb' }}>
                            <button
                                className={`btn ${filter === 'all' ? '' : 'ghost'}`}
                                onClick={() => setFilter('all')}
                                style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: filter === 'all' ? '2px solid var(--brand-1)' : '2px solid transparent' }}
                            >
                                All ({subscriptions.length})
                            </button>
                            <button
                                className={`btn ${filter === 'active' ? '' : 'ghost'}`}
                                onClick={() => setFilter('active')}
                                style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: filter === 'active' ? '2px solid var(--brand-1)' : '2px solid transparent' }}
                            >
                                Active ({subscriptions.filter(s => getSubscriptionStatus(s) === 'active').length})
                            </button>
                            <button
                                className={`btn ${filter === 'expired' ? '' : 'ghost'}`}
                                onClick={() => setFilter('expired')}
                                style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: filter === 'expired' ? '2px solid var(--brand-1)' : '2px solid transparent' }}
                            >
                                Expired ({subscriptions.filter(s => getSubscriptionStatus(s) === 'expired').length})
                            </button>
                        </div>
                    </div>

                    {/* Subscriptions List */}
                    {filteredSubscriptions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                            <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>No Subscriptions Found</h3>
                            <p className="kv" style={{ marginBottom: 20 }}>
                                {filter === 'all'
                                    ? "You don't have any subscriptions yet. Browse packages to get started!"
                                    : `No ${filter} subscriptions found.`
                                }
                            </p>
                            <Link href="/" className="btn">
                                Browse Packages
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 20 }}>
                            {filteredSubscriptions.map(subscription => {
                                const status = getSubscriptionStatus(subscription);
                                const isActive = status === 'active';

                                return (
                                    <div key={subscription._id} className="card" style={{
                                        border: isActive ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
                                        background: isActive ? '#f0fdfa' : 'white'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div>
                                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 4 }}>
                                                    {subscription.packageName || subscription.packageKey}
                                                </h3>
                                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{
                                                        color: getStatusColor(status),
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: `${getStatusColor(status)}20`
                                                    }}>
                                                        {getStatusText(status)}
                                                    </span>
                                                    <span className="kv" style={{ fontSize: 14 }}>
                                                        {formatDuration(subscription.durationSeconds)}
                                                    </span>
                                                    <span className="kv" style={{ fontSize: 14 }}>
                                                        {Math.round(subscription.speedKbps / 1000 * 10) / 10} Mbps
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--brand-1)', fontSize: 18 }}>
                                                    KES {subscription.priceKES}
                                                </div>
                                                {isActive && (
                                                    <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                                                        {getTimeRemaining(subscription.endAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                                            <div>
                                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Started</div>
                                                <div style={{ fontSize: 14, color: 'var(--brand-2)' }}>
                                                    {formatDate(subscription.startAt)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Expires</div>
                                                <div style={{ fontSize: 14, color: 'var(--brand-2)' }}>
                                                    {formatDate(subscription.endAt)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Devices</div>
                                                <div style={{ fontSize: 14, color: 'var(--brand-2)' }}>
                                                    {subscription.devices?.length || 0} / {subscription.devicesAllowed}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Device List */}
                                        {subscription.devices && subscription.devices.length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <div className="kv" style={{ fontSize: 12, marginBottom: 8 }}>Linked Devices</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {subscription.devices.map((device, index) => (
                                                        <div key={index} style={{
                                                            padding: '4px 8px',
                                                            background: '#f3f4f6',
                                                            borderRadius: '4px',
                                                            fontSize: 12,
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {device.mac}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                            <Link
                                                href={`/account/subscriptions/${subscription._id}`}
                                                className="btn ghost"
                                                style={{ padding: '8px 16px' }}
                                            >
                                                Manage Devices
                                            </Link>
                                            {isActive && (
                                                <button
                                                    className="btn ghost"
                                                    style={{ padding: '8px 16px', color: '#ef4444' }}
                                                    disabled
                                                >
                                                    Cancel (Coming Soon)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Reconnect Section */}
                    {subscriptions.filter(s => getSubscriptionStatus(s) === 'active').length > 0 && (
                        <div style={{ marginTop: 32, marginBottom: 32 }}>
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

                    {/* Quick Actions */}
                    <div style={{ marginTop: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            <Link href="/" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Browse Packages</h3>
                                <p className="kv">View available internet packages</p>
                            </Link>

                            <Link href="/account/devices" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Device Management</h3>
                                <p className="kv">Manage all your linked devices</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}















