/**
 * Device Card Component
 * Displays individual device information with actions
 */

import Link from 'next/link';

export default function DeviceCard({
    device,
    onRemove,
    showSubscription = true,
    showActions = true
}) {
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

    const handleRemove = () => {
        if (confirm(`Are you sure you want to remove device ${device.mac}?`)) {
            onRemove(device.id || device._id, device.subscriptionId);
        }
    };

    return (
        <div className="card" style={{
            border: device.subscriptionStatus === 'active' ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
            background: device.subscriptionStatus === 'active' ? '#f0fdfa' : 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-2)', fontSize: 16 }}>
                            {device.mac}
                        </div>
                        <span style={{
                            color: getStatusColor(device.subscriptionStatus),
                            fontWeight: 600,
                            fontSize: 12,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${getStatusColor(device.subscriptionStatus)}20`
                        }}>
                            {getStatusText(device.subscriptionStatus)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        <div>
                            <div className="kv" style={{ fontSize: 12, marginBottom: 2 }}>Device Label</div>
                            <div style={{ fontSize: 14, color: 'var(--brand-2)' }}>
                                {device.label || 'Unnamed Device'}
                            </div>
                        </div>

                        {showSubscription && device.subscriptionName && (
                            <div>
                                <div className="kv" style={{ fontSize: 12, marginBottom: 2 }}>Subscription</div>
                                <div style={{ fontSize: 14, color: 'var(--brand-2)' }}>
                                    {device.subscriptionName}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Device Info */}
                    {device.lastSeen && (
                        <div style={{ marginTop: 8 }}>
                            <div className="kv" style={{ fontSize: 12, marginBottom: 2 }}>Last Seen</div>
                            <div style={{ fontSize: 12, color: 'var(--brand-2)' }}>
                                {new Date(device.lastSeen).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>

                {showActions && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {device.subscriptionId && (
                            <Link
                                href={`/account/subscriptions/${device.subscriptionId}`}
                                className="btn ghost"
                                style={{ padding: '6px 12px' }}
                            >
                                Manage
                            </Link>
                        )}
                        <button
                            className="btn ghost"
                            onClick={handleRemove}
                            style={{ padding: '6px 12px', color: '#ef4444' }}
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}






















