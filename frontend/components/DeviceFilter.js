/**
 * Device Filter Component
 * Search and filter devices by various criteria
 */

import { useState, useMemo } from 'react';

export default function DeviceFilter({
    devices = [],
    onFilteredDevices,
    showSearch = true,
    showStatusFilter = true,
    showSubscriptionFilter = true
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subscriptionFilter, setSubscriptionFilter] = useState('all');

    // Get unique subscriptions for filter
    const subscriptions = useMemo(() => {
        const uniqueSubs = new Map();
        devices.forEach(device => {
            if (device.subscriptionId && device.subscriptionName) {
                uniqueSubs.set(device.subscriptionId, {
                    id: device.subscriptionId,
                    name: device.subscriptionName
                });
            }
        });
        return Array.from(uniqueSubs.values());
    }, [devices]);

    // Filter devices based on criteria
    const filteredDevices = useMemo(() => {
        return devices.filter(device => {
            // Search filter
            if (showSearch && searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    device.mac.toLowerCase().includes(searchLower) ||
                    (device.label && device.label.toLowerCase().includes(searchLower)) ||
                    (device.subscriptionName && device.subscriptionName.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Status filter
            if (showStatusFilter && statusFilter !== 'all') {
                if (device.subscriptionStatus !== statusFilter) return false;
            }

            // Subscription filter
            if (showSubscriptionFilter && subscriptionFilter !== 'all') {
                if (device.subscriptionId !== subscriptionFilter) return false;
            }

            return true;
        });
    }, [devices, searchTerm, statusFilter, subscriptionFilter, showSearch, showStatusFilter, showSubscriptionFilter]);

    // Update parent component with filtered devices
    useMemo(() => {
        if (onFilteredDevices) {
            onFilteredDevices(filteredDevices);
        }
    }, [filteredDevices, onFilteredDevices]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSubscriptionFilter('all');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all';

    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Search */}
                {showSearch && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <input
                            type="text"
                            placeholder="Search devices by MAC, label, or subscription..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                            style={{ width: '100%' }}
                        />
                    </div>
                )}

                {/* Status Filter */}
                {showStatusFilter && (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input"
                        style={{ minWidth: 120 }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="pending">Pending</option>
                    </select>
                )}

                {/* Subscription Filter */}
                {showSubscriptionFilter && subscriptions.length > 0 && (
                    <select
                        value={subscriptionFilter}
                        onChange={(e) => setSubscriptionFilter(e.target.value)}
                        className="input"
                        style={{ minWidth: 150 }}
                    >
                        <option value="all">All Subscriptions</option>
                        {subscriptions.map(sub => (
                            <option key={sub.id} value={sub.id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="btn ghost"
                        style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Summary */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="kv" style={{ fontSize: 14 }}>
                    Showing {filteredDevices.length} of {devices.length} devices
                </div>

                {hasActiveFilters && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {searchTerm && (
                            <div style={{
                                padding: '4px 8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                Search: "{searchTerm}"
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#6b7280'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {statusFilter !== 'all' && (
                            <div style={{
                                padding: '4px 8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                Status: {statusFilter}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#6b7280'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {subscriptionFilter !== 'all' && (
                            <div style={{
                                padding: '4px 8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                Subscription: {subscriptions.find(s => s.id === subscriptionFilter)?.name || 'Unknown'}
                                <button
                                    onClick={() => setSubscriptionFilter('all')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#6b7280'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}






















