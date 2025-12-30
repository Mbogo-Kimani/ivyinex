import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DeviceStats from '../../components/DeviceStats';
import DeviceFilter from '../../components/DeviceFilter';
import DeviceCard from '../../components/DeviceCard';
import DeviceAddForm from '../../components/DeviceAddForm';
import * as api from '../../lib/api';

export default function DeviceManagementPage() {
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [devices, setDevices] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [addingDevice, setAddingDevice] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subscriptionsData] = await Promise.all([
                api.getSubscriptions()
            ]);

            setSubscriptions(subscriptionsData);

            // Extract all devices from subscriptions
            const allDevices = [];
            subscriptionsData.forEach(subscription => {
                if (subscription.devices && subscription.devices.length > 0) {
                    subscription.devices.forEach(device => {
                        allDevices.push({
                            ...device,
                            subscriptionId: subscription._id,
                            subscriptionName: subscription.packageName || subscription.packageKey,
                            subscriptionStatus: getSubscriptionStatus(subscription)
                        });
                    });
                }
            });

            setDevices(allDevices);
            setFilteredDevices(allDevices);
        } catch (err) {
            showError('Failed to load device data');
            console.error('Device load error:', err);
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

    const handleAddDevice = async (deviceData, subscriptionId) => {
        try {
            setAddingDevice(true);
            await api.addDeviceToSubscription(subscriptionId, deviceData);
            showSuccess('Device added successfully!');
            setShowAddDevice(false);
            loadData(); // Reload data
        } catch (err) {
            showError(err.message || 'Failed to add device');
        } finally {
            setAddingDevice(false);
        }
    };

    const handleRemoveDevice = async (deviceId, subscriptionId) => {
        if (!confirm('Are you sure you want to remove this device?')) return;

        try {
            await api.removeDevice(subscriptionId, deviceId);
            showSuccess('Device removed successfully!');
            loadData(); // Reload data
        } catch (err) {
            showError(err.message || 'Failed to remove device');
        }
    };

    const activeSubscriptions = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'active');

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
                            <div className="kv">Loading devices...</div>
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
                            Device Management
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage all your devices across subscriptions
                        </p>
                    </div>

                    {/* Device Statistics */}
                    <DeviceStats
                        devices={devices}
                        subscriptions={subscriptions}
                        loading={loading}
                    />

                    {/* Device Filter */}
                    <DeviceFilter
                        devices={devices}
                        onFilteredDevices={setFilteredDevices}
                        showSearch={true}
                        showStatusFilter={true}
                        showSubscriptionFilter={true}
                    />

                    {/* Add Device Button */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ color: 'var(--brand-2)', fontSize: 24 }}>All Devices</h2>
                        {activeSubscriptions.length > 0 && (
                            <button
                                className="btn"
                                onClick={() => setShowAddDevice(true)}
                                style={{ padding: '8px 16px' }}
                            >
                                Add Device
                            </button>
                        )}
                    </div>

                    {/* Devices List */}
                    {filteredDevices.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                            <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>No Devices Found</h3>
                            <p className="kv" style={{ marginBottom: 20 }}>
                                {devices.length === 0
                                    ? (activeSubscriptions.length === 0
                                        ? "You need an active subscription to add devices. Browse packages to get started!"
                                        : "Add devices to your subscriptions to get started.")
                                    : "No devices match your current filters. Try adjusting your search criteria."
                                }
                            </p>
                            {devices.length === 0 ? (
                                activeSubscriptions.length === 0 ? (
                                    <Link href="/" className="btn">
                                        Browse Packages
                                    </Link>
                                ) : (
                                    <button
                                        className="btn"
                                        onClick={() => setShowAddDevice(true)}
                                    >
                                        Add Your First Device
                                    </button>
                                )
                            ) : (
                                <button
                                    className="btn ghost"
                                    onClick={() => {
                                        // Clear all filters
                                        setFilteredDevices(devices);
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {filteredDevices.map((device, index) => (
                                <DeviceCard
                                    key={`${device.subscriptionId}-${index}`}
                                    device={device}
                                    onRemove={handleRemoveDevice}
                                    showSubscription={true}
                                    showActions={true}
                                />
                            ))}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{ marginTop: 32 }}>
                        <h2 style={{ fontSize: 24, color: 'var(--brand-2)', marginBottom: 16 }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            <Link href="/account/subscriptions" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>My Subscriptions</h3>
                                <p className="kv">View and manage your subscriptions</p>
                            </Link>

                            <Link href="/" className="card" style={{ textDecoration: 'none', display: 'block' }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Browse Packages</h3>
                                <p className="kv">View available internet packages</p>
                            </Link>
                        </div>
                    </div>

                    {/* Add Device Modal */}
                    {showAddDevice && (
                        <div className="modal-backdrop">
                            <div className="modal" style={{ maxWidth: 500 }}>
                                <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Add Device</h3>

                                <DeviceAddForm
                                    subscriptions={activeSubscriptions}
                                    onSubmit={handleAddDevice}
                                    onCancel={() => setShowAddDevice(false)}
                                    loading={addingDevice}
                                    showSubscription={true}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
