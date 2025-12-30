/**
 * Device Statistics Component
 * Displays device statistics and metrics
 */

export default function DeviceStats({
    devices = [],
    subscriptions = [],
    loading = false
}) {
    const getSubscriptionStatus = (subscription) => {
        const now = new Date();
        const endDate = new Date(subscription.endAt);

        if (subscription.status === 'cancelled') return 'cancelled';
        if (subscription.status === 'pending') return 'pending';
        if (endDate <= now) return 'expired';
        return 'active';
    };

    const activeSubscriptions = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'active');
    const activeDevices = devices.filter(device => device.subscriptionStatus === 'active');
    const expiredDevices = devices.filter(device => device.subscriptionStatus === 'expired');

    // Group devices by subscription
    const devicesBySubscription = devices.reduce((acc, device) => {
        const subId = device.subscriptionId;
        if (!acc[subId]) {
            acc[subId] = {
                subscriptionName: device.subscriptionName,
                devices: [],
                status: device.subscriptionStatus
            };
        }
        acc[subId].devices.push(device);
        return acc;
    }, {});

    // Calculate device usage percentage
    const totalDeviceSlots = subscriptions.reduce((total, sub) => {
        return total + (sub.devicesAllowed || 0);
    }, 0);

    const usedDeviceSlots = devices.length;
    const deviceUsagePercentage = totalDeviceSlots > 0 ? Math.round((usedDeviceSlots / totalDeviceSlots) * 100) : 0;

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            border: '4px solid #e5e7eb',
                            borderTop: '4px solid var(--brand-1)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }}></div>
                        <div className="kv">Loading...</div>
                    </div>
                ))}
                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Main Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-1)', marginBottom: 8 }}>
                        {devices.length}
                    </div>
                    <div className="kv">Total Devices</div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                        {activeDevices.length}
                    </div>
                    <div className="kv">Active Devices</div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
                        {expiredDevices.length}
                    </div>
                    <div className="kv">Expired Devices</div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-1)', marginBottom: 8 }}>
                        {deviceUsagePercentage}%
                    </div>
                    <div className="kv">Device Usage</div>
                </div>
            </div>

            {/* Device Usage Progress */}
            {totalDeviceSlots > 0 && (
                <div className="card" style={{ marginBottom: 32 }}>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Device Usage</h3>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className="kv" style={{ fontSize: 14 }}>Used Device Slots</span>
                            <span className="kv" style={{ fontSize: 14 }}>{usedDeviceSlots} / {totalDeviceSlots}</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: 8,
                            background: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${deviceUsagePercentage}%`,
                                height: '100%',
                                background: deviceUsagePercentage > 80 ? '#ef4444' : deviceUsagePercentage > 60 ? '#f59e0b' : 'linear-gradient(90deg, var(--brand-1), var(--accent))',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>
                    <div className="kv" style={{ fontSize: 12 }}>
                        {deviceUsagePercentage > 80
                            ? 'You\'re using most of your available device slots'
                            : deviceUsagePercentage > 60
                                ? 'You\'re using a good portion of your available device slots'
                                : 'You have plenty of device slots available'
                        }
                    </div>
                </div>
            )}

            {/* Devices by Subscription */}
            {Object.keys(devicesBySubscription).length > 0 && (
                <div className="card" style={{ marginBottom: 32 }}>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Devices by Subscription</h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                        {Object.entries(devicesBySubscription).map(([subId, data]) => (
                            <div key={subId} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: data.status === 'active' ? '#f0fdfa' : '#f9fafb',
                                borderRadius: '8px',
                                border: data.status === 'active' ? '1px solid #a7f3d0' : '1px solid #e5e7eb'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>
                                        {data.subscriptionName}
                                    </div>
                                    <div className="kv" style={{ fontSize: 12 }}>
                                        {data.devices.length} device{data.devices.length !== 1 ? 's' : ''} • {data.status}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {data.devices.map((device, index) => (
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
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Insights */}
            <div className="card">
                <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Quick Insights</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                    {devices.length === 0 && (
                        <div style={{
                            padding: 12,
                            background: '#fef3c7',
                            borderRadius: '8px',
                            border: '1px solid #f59e0b'
                        }}>
                            <div className="kv" style={{ color: '#92400e', fontSize: 14 }}>
                                <strong>No devices yet:</strong> Add devices to your subscriptions to get started with internet access.
                            </div>
                        </div>
                    )}

                    {activeDevices.length > 0 && expiredDevices.length === 0 && (
                        <div style={{
                            padding: 12,
                            background: '#f0fdfa',
                            borderRadius: '8px',
                            border: '1px solid #a7f3d0'
                        }}>
                            <div className="kv" style={{ color: '#065f46', fontSize: 14 }}>
                                <strong>All devices active:</strong> Great! All your devices are currently active and ready to use.
                            </div>
                        </div>
                    )}

                    {expiredDevices.length > 0 && (
                        <div style={{
                            padding: 12,
                            background: '#fef2f2',
                            borderRadius: '8px',
                            border: '1px solid #fecaca'
                        }}>
                            <div className="kv" style={{ color: '#991b1b', fontSize: 14 }}>
                                <strong>Some devices expired:</strong> {expiredDevices.length} device{expiredDevices.length !== 1 ? 's' : ''} are linked to expired subscriptions.
                            </div>
                        </div>
                    )}

                    {deviceUsagePercentage > 80 && (
                        <div style={{
                            padding: 12,
                            background: '#fef3c7',
                            borderRadius: '8px',
                            border: '1px solid #f59e0b'
                        }}>
                            <div className="kv" style={{ color: '#92400e', fontSize: 14 }}>
                                <strong>High device usage:</strong> You're using {deviceUsagePercentage}% of your available device slots.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}






















