import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getPortalData } from '../lib/portalData';
import * as api from '../lib/api';

export default function ReconnectButton({ onSuccess, className = '', style = {} }) {
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const { showSuccess, showError } = useToast();

    // Check connection status on mount
    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const status = await api.checkConnectionStatus();
            setConnectionStatus(status);
        } catch (error) {
            console.error('Failed to check connection status:', error);
            setConnectionStatus({ ok: false, message: 'Unable to check connection status' });
        }
    };

    const handleReconnect = async () => {
        try {
            setLoading(true);

            // Get device info from portal data or prompt user
            const portalData = getPortalData();
            let mac = portalData?.mac;
            let ip = portalData?.ip;

            // If no portal data, prompt user for MAC address
            if (!mac) {
                mac = prompt('Enter your device MAC address (e.g., AA:BB:CC:DD:EE:FF):');
                if (!mac) {
                    showError('MAC address is required for reconnection');
                    return;
                }
            }

            // Validate MAC format
            const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
            if (!macRegex.test(mac)) {
                showError('Invalid MAC address format. Please use format like AA:BB:CC:DD:EE:FF');
                return;
            }

            console.log('Attempting to reconnect device:', { mac, ip });

            const result = await api.reconnectDevice(mac, ip);

            if (result.ok) {
                showSuccess(result.message);
                if (onSuccess) onSuccess(result);
            } else {
                // Show more detailed error information
                const errorMessage = result.message || 'Reconnection failed';
                const hasTechnicalDetails = result.results && result.results.some(r => r.technicalDetails);

                if (hasTechnicalDetails) {
                    const failedResults = result.results.filter(r => !r.success);
                    const errorDetails = failedResults.map(r =>
                        `${r.packageName}: ${r.message}`
                    ).join('\n');

                    showError(`${errorMessage}\n\nDetails:\n${errorDetails}`);
                } else {
                    showError(errorMessage);
                }
            }

        } catch (error) {
            console.error('Reconnect error:', error);
            showError(error.message || 'Failed to reconnect device');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Connection Status Indicator */}
            {connectionStatus && (
                <div style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: connectionStatus.ok ? '#d1fae5' : '#fee2e2',
                    color: connectionStatus.ok ? '#065f46' : '#dc2626',
                    textAlign: 'center'
                }}>
                    {connectionStatus.ok ? '✅ Router Connected' : '❌ Router Disconnected'}
                </div>
            )}

            <button
                onClick={handleReconnect}
                disabled={loading}
                className={`btn ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    ...style
                }}
            >
                {loading ? (
                    <>
                        <div style={{
                            width: 16,
                            height: 16,
                            border: '2px solid transparent',
                            borderTop: '2px solid currentColor',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        Reconnecting...
                    </>
                ) : (
                    <>
                        <span>🔄</span>
                        Reconnect Device
                    </>
                )}
            </button>

            {/* Troubleshooting Info */}
            {connectionStatus && !connectionStatus.ok && (
                <div style={{
                    fontSize: 11,
                    color: '#6b7280',
                    textAlign: 'center',
                    maxWidth: 200,
                    lineHeight: 1.4
                }}>
                    Router connection issues detected.
                    Contact support if problems persist.
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
