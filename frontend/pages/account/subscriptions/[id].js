import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getPortalData } from '../../../lib/portalData';
import * as api from '../../../lib/api';

export default function SubscriptionDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [newDevice, setNewDevice] = useState({ mac: '', label: '' });
    const [addingDevice, setAddingDevice] = useState(false);
    const [portalData, setPortalData] = useState(null);

    useEffect(() => {
        if (id) {
            loadSubscription();
        }
    }, [id]);

    useEffect(() => {
        // Get portal data if available
        const data = getPortalData();
        if (data) {
            setPortalData(data);
            setNewDevice(prev => ({ ...prev, mac: data.mac || '' }));
        }
    }, []);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const data = await api.getSubscription(id);
            setSubscription(data);
        } catch (err) {
            showError('Failed to load subscription details');
            console.error('Subscription load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSubscriptionStatus = (sub) => {
        const now = new Date();
        const endDate = new Date(sub.endAt);

        if (sub.status === 'cancelled') return 'cancelled';
        if (sub.status === 'pending') return 'pending';
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
            month: 'long',
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

    const handleAddDevice = async (e) => {
        e.preventDefault();
        if (!newDevice.mac.trim()) return;

        try {
            setAddingDevice(true);
            const deviceData = {
                mac: newDevice.mac.trim().toUpperCase(),
                label: newDevice.label.trim() || 'Unnamed Device',
                autoCapture: !!portalData?.mac
            };

            await api.addDeviceToSubscription(id, deviceData);
            showSuccess('Device added successfully!');
            setNewDevice({ mac: '', label: '' });
            setShowAddDevice(false);
            loadSubscription(); // Reload subscription data
        } catch (err) {
            showError(err.message || 'Failed to add device');
        } finally {
            setAddingDevice(false);
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        if (!confirm('Are you sure you want to remove this device?')) return;

        try {
            await api.removeDevice(id, deviceId);
            showSuccess('Device removed successfully!');
            loadSubscription(); // Reload subscription data
        } catch (err) {
            showError(err.message || 'Failed to remove device');
        }
    };

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
                            <div className="kv">Loading subscription...</div>
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

    if (!subscription) {
        return (
            <ProtectedRoute>
                <div style={{ minHeight: '100vh', padding: 20 }}>
                    <div className="container">
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <h2 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Subscription Not Found</h2>
                            <p className="kv" style={{ marginBottom: 20 }}>
                                The subscription you're looking for doesn't exist or you don't have access to it.
                            </p>
                            <Link href="/account/subscriptions" className="btn">
                                Back to Subscriptions
                            </Link>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const status = getSubscriptionStatus(subscription);
    const isActive = status === 'active';
    const canAddDevice = isActive && (subscription.devices?.length || 0) < subscription.devicesAllowed;

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', padding: 20 }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <Link href="/account/subscriptions" className="btn ghost" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ← Back to Subscriptions
                        </Link>
                        <h1 style={{ color: 'var(--brand-2)', fontSize: 32, marginBottom: 8 }}>
                            {subscription.packageName || subscription.packageKey}
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage devices and settings for this subscription
                        </p>
                    </div>

                    {/* Subscription Overview */}
                    <div className="card" style={{
                        marginBottom: 32,
                        border: isActive ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
                        background: isActive ? '#f0fdfa' : 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{
                                        color: getStatusColor(status),
                                        fontWeight: 600,
                                        fontSize: 16,
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        background: `${getStatusColor(status)}20`
                                    }}>
                                        {getStatusText(status)}
                                    </span>
                                    <span className="kv" style={{ fontSize: 16 }}>
                                        {formatDuration(subscription.durationSeconds)}
                                    </span>
                                    <span className="kv" style={{ fontSize: 16 }}>
                                        {Math.round(subscription.speedKbps / 1000 * 10) / 10} Mbps
                                    </span>
                                </div>
                                {isActive && (
                                    <div style={{ color: 'var(--brand-1)', fontWeight: 600, fontSize: 18 }}>
                                        {getTimeRemaining(subscription.endAt)}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: 'var(--brand-1)', fontSize: 24 }}>
                                    KES {subscription.priceKES}
                                </div>
                                <div className="kv" style={{ fontSize: 14 }}>
                                    {subscription.devices?.length || 0} / {subscription.devicesAllowed} devices
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                            <div>
                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Started</div>
                                <div style={{ fontSize: 16, color: 'var(--brand-2)' }}>
                                    {formatDate(subscription.startAt)}
                                </div>
                            </div>
                            <div>
                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Expires</div>
                                <div style={{ fontSize: 16, color: 'var(--brand-2)' }}>
                                    {formatDate(subscription.endAt)}
                                </div>
                            </div>
                            <div>
                                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Subscription ID</div>
                                <div style={{ fontSize: 14, color: 'var(--brand-2)', fontFamily: 'monospace' }}>
                                    {subscription._id}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Device Management */}
                    <div className="card" style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ color: 'var(--brand-2)', fontSize: 24 }}>Linked Devices</h2>
                            {canAddDevice && (
                                <button
                                    className="btn"
                                    onClick={() => setShowAddDevice(true)}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Add Device
                                </button>
                            )}
                        </div>

                        {subscription.devices && subscription.devices.length > 0 ? (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {subscription.devices.map((device, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>
                                                {device.mac}
                                            </div>
                                            <div className="kv" style={{ fontSize: 12 }}>
                                                {device.label || 'Unnamed Device'}
                                            </div>
                                        </div>
                                        <button
                                            className="btn ghost"
                                            onClick={() => handleRemoveDevice(device.id || index)}
                                            style={{ padding: '6px 12px', color: '#ef4444' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>No Devices Linked</h3>
                                <p className="kv" style={{ marginBottom: 16 }}>
                                    Add devices to use this subscription
                                </p>
                                {canAddDevice && (
                                    <button
                                        className="btn"
                                        onClick={() => setShowAddDevice(true)}
                                    >
                                        Add Your First Device
                                    </button>
                                )}
                            </div>
                        )}

                        {!canAddDevice && subscription.devices && subscription.devices.length >= subscription.devicesAllowed && (
                            <div style={{
                                marginTop: 16,
                                padding: 12,
                                background: '#fef3c7',
                                borderRadius: '8px',
                                border: '1px solid #f59e0b'
                            }}>
                                <div className="kv" style={{ color: '#92400e', fontSize: 14 }}>
                                    <strong>Device limit reached:</strong> This subscription allows {subscription.devicesAllowed} device{subscription.devicesAllowed > 1 ? 's' : ''}.
                                    Remove a device to add a new one.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add Device Modal */}
                    {showAddDevice && (
                        <div className="modal-backdrop">
                            <div className="modal" style={{ maxWidth: 500 }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Add Device</h3>

                                <form onSubmit={handleAddDevice}>
                                    <div style={{ marginBottom: 20 }}>
                                        <label htmlFor="mac">Device MAC Address *</label>
                                        <input
                                            type="text"
                                            id="mac"
                                            value={newDevice.mac}
                                            onChange={(e) => setNewDevice(prev => ({ ...prev, mac: e.target.value.toUpperCase() }))}
                                            className="input"
                                            placeholder="AA:BB:CC:DD:EE:FF"
                                            disabled={addingDevice}
                                            required
                                        />
                                        <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                                            The MAC address identifies which device can use this subscription
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label htmlFor="label">Device Label (Optional)</label>
                                        <input
                                            type="text"
                                            id="label"
                                            value={newDevice.label}
                                            onChange={(e) => setNewDevice(prev => ({ ...prev, label: e.target.value }))}
                                            className="input"
                                            placeholder="e.g., My Phone, Laptop"
                                            disabled={addingDevice}
                                        />
                                        <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                                            A friendly name to identify this device
                                        </div>
                                    </div>

                                    {portalData?.mac && (
                                        <div style={{ marginBottom: 20, padding: 12, background: '#f0fdfa', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                            <div className="kv" style={{ color: '#065f46', fontSize: 14 }}>
                                                <strong>Device detected:</strong> {portalData.mac}
                                            </div>
                                            <div className="kv" style={{ color: '#065f46', fontSize: 12, marginTop: 4 }}>
                                                This device will be automatically linked
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            type="submit"
                                            className="btn"
                                            disabled={addingDevice || !newDevice.mac.trim()}
                                        >
                                            {addingDevice ? 'Adding...' : 'Add Device'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn ghost"
                                            onClick={() => {
                                                setShowAddDevice(false);
                                                setNewDevice({ mac: '', label: '' });
                                            }}
                                            disabled={addingDevice}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}






















