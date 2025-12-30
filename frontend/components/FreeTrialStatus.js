/**
 * Free Trial Status Component
 * Displays free trial status and remaining time
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FreeTrialStatus({
    subscription,
    onRefresh
}) {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        if (!subscription) return;

        const updateTimeRemaining = () => {
            const now = new Date();
            const endDate = new Date(subscription.endAt);
            const diff = endDate - now;

            if (diff <= 0) {
                setTimeRemaining('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
            } else if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s remaining`);
            } else {
                setTimeRemaining(`${seconds}s remaining`);
            }
        };

        updateTimeRemaining();
        const interval = setInterval(updateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [subscription]);

    const getProgressPercentage = () => {
        if (!subscription) return 0;
        const now = new Date();
        const start = new Date(subscription.startAt);
        const end = new Date(subscription.endAt);

        const total = end - start;
        const elapsed = now - start;

        if (elapsed <= 0) return 0;
        if (elapsed >= total) return 100;

        return Math.round((elapsed / total) * 100);
    };

    const isExpired = timeRemaining === 'Expired';
    const progressPercentage = getProgressPercentage();

    if (!subscription) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                <div className="kv">No free trial found</div>
            </div>
        );
    }

    return (
        <div className="card" style={{
            border: isExpired ? '1px solid #fecaca' : '1px solid #a7f3d0',
            background: isExpired ? '#fef2f2' : '#f0fdfa'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 8, fontSize: 20 }}>
                        🎁 Free Trial
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{
                            color: isExpired ? '#ef4444' : '#10b981',
                            fontWeight: 600,
                            fontSize: 14,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: isExpired ? '#ef444420' : '#10b98120'
                        }}>
                            {isExpired ? 'Expired' : 'Active'}
                        </span>
                        <span className="kv" style={{ fontSize: 14 }}>
                            1 Day Trial
                        </span>
                        <span className="kv" style={{ fontSize: 14 }}>
                            {Math.round(subscription.speedKbps / 1000 * 10) / 10} Mbps
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--brand-1)', fontSize: 18 }}>
                        FREE
                    </div>
                    <div className="kv" style={{ fontSize: 12 }}>
                        {subscription.devices?.length || 0} device{subscription.devices?.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {!isExpired && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="kv" style={{ fontSize: 14 }}>Trial Progress</span>
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
                            background: progressPercentage > 80 ? '#f59e0b' : 'linear-gradient(90deg, var(--brand-1), var(--accent))',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Time Remaining */}
            <div style={{ marginBottom: 16 }}>
                <div className="kv" style={{ fontSize: 12, marginBottom: 4 }}>Time Remaining</div>
                <div style={{
                    fontSize: 16,
                    color: isExpired ? '#ef4444' : 'var(--brand-2)',
                    fontWeight: 600
                }}>
                    {timeRemaining}
                </div>
            </div>

            {/* Device List */}
            {subscription.devices && subscription.devices.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div className="kv" style={{ fontSize: 12, marginBottom: 8 }}>Linked Device</div>
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
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {!isExpired && (
                    <button
                        className="btn ghost"
                        onClick={onRefresh}
                        style={{ padding: '8px 16px' }}
                    >
                        Refresh Status
                    </button>
                )}
                <Link
                    href="/"
                    className="btn"
                    style={{ padding: '8px 16px' }}
                >
                    {isExpired ? 'Browse Packages' : 'Upgrade Now'}
                </Link>
            </div>
        </div>
    );
}






















