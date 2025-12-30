/**
 * Subscription Status Component
 * Displays subscription status, timing, and key information
 */

export default function SubscriptionStatus({ subscription, showActions = true }) {
    if (!subscription) return null;

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

    const getProgressPercentage = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        const total = end - start;
        const elapsed = now - start;

        if (elapsed <= 0) return 0;
        if (elapsed >= total) return 100;

        return Math.round((elapsed / total) * 100);
    };

    const status = getSubscriptionStatus(subscription);
    const isActive = status === 'active';
    const progressPercentage = getProgressPercentage(subscription.startAt, subscription.endAt);

    return (
        <div className="card" style={{
            border: isActive ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
            background: isActive ? '#f0fdfa' : 'white'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 8, fontSize: 24 }}>
                        {subscription.packageName || subscription.packageKey}
                    </h3>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
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
                    <div style={{ fontWeight: 700, color: 'var(--brand-1)', fontSize: 28 }}>
                        KES {subscription.priceKES}
                    </div>
                    <div className="kv" style={{ fontSize: 14 }}>
                        {subscription.devices?.length || 0} / {subscription.devicesAllowed} devices
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {isActive && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="kv" style={{ fontSize: 14 }}>Subscription Progress</span>
                        <span className="kv" style={{ fontSize: 14 }}>{progressPercentage}%</span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: 8,
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--brand-1), var(--accent))',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
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
                {subscription.paymentId && (
                    <div>
                        <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Payment ID</div>
                        <div style={{ fontSize: 14, color: 'var(--brand-2)', fontFamily: 'monospace' }}>
                            {subscription.paymentId}
                        </div>
                    </div>
                )}
            </div>

            {/* Device Summary */}
            {subscription.devices && subscription.devices.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div className="kv" style={{ fontSize: 12, marginBottom: 8 }}>Linked Devices</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {subscription.devices.map((device, index) => (
                            <div key={index} style={{
                                padding: '6px 12px',
                                background: '#f3f4f6',
                                borderRadius: '6px',
                                fontSize: 14,
                                fontFamily: 'monospace',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <span>{device.mac}</span>
                                {device.label && (
                                    <span style={{ color: '#6b7280', fontSize: 12 }}>
                                        ({device.label})
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                        className="btn ghost"
                        style={{ padding: '8px 16px' }}
                        disabled
                    >
                        View Details
                    </button>
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
            )}
        </div>
    );
}






















