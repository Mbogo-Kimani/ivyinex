/**
 * Free Trial Claim Component
 * Handles free trial claiming with device detection and validation
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { validateMacAddress, normalizeMacAddress } from '../lib/validation';
import { getPortalData } from '../lib/portalData';
import * as api from '../lib/api';

export default function FreeTrialClaim({
    onSuccess,
    onCancel,
    showCancel = true
}) {
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);
    const [device, setDevice] = useState({ mac: '', label: '' });
    const [portalData, setPortalData] = useState(null);
    const [macError, setMacError] = useState('');

    useEffect(() => {
        // Get portal data if available
        const data = getPortalData();
        if (data) {
            setPortalData(data);
            setDevice(prev => ({ ...prev, mac: data.mac || '' }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDevice(prev => ({
            ...prev,
            [name]: name === 'mac' ? value.toUpperCase() : value
        }));

        // Clear error when user starts typing
        if (macError) {
            setMacError('');
        }
    };

    const handleConnectCurrentDevice = () => {
        if (portalData?.mac) {
            setDevice(prev => ({ ...prev, mac: portalData.mac }));
            setMacError('');
        } else {
            showError('Unable to detect current device. Please enter MAC address manually.');
        }
    };

    const handleClaimCurrentDevice = async () => {
        if (!portalData?.mac) {
            showError('Unable to detect current device. Please enter MAC address manually.');
            return;
        }

        try {
            setLoading(true);
            const normalizedMac = normalizeMacAddress(portalData.mac);
            const response = await api.claimFreeTrial(normalizedMac);

            if (response.ok) {
                showSuccess('Free trial activated for this device. Enjoy!');
                if (onSuccess) onSuccess(response);
            } else {
                throw new Error(response.error || 'Failed to claim free trial');
            }
        } catch (err) {
            showError(err.message || 'Failed to claim free trial');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimTrial = async (e) => {
        e.preventDefault();

        // Validate MAC address
        const macValidation = validateMacAddress(device.mac);
        if (!macValidation.isValid) {
            setMacError(macValidation.message);
            return;
        }

        try {
            setLoading(true);
            const normalizedMac = normalizeMacAddress(device.mac);

            const response = await api.claimFreeTrial(normalizedMac);

            if (response.ok) {
                showSuccess('Free trial claimed successfully! You now have 1 day of free internet access.');
                if (onSuccess) onSuccess(response);
            } else {
                throw new Error(response.error || 'Failed to claim free trial');
            }
        } catch (err) {
            showError(err.message || 'Failed to claim free trial');
        } finally {
            setLoading(false);
        }
    };

    const canClaimTrial = user && !user.freeTrialUsed;

    if (!canClaimTrial) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40, background: '#f9fafb' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Free Trial Already Used</h3>
                <p className="kv" style={{ marginBottom: 16 }}>
                    You've already claimed your free trial. Browse our packages to continue enjoying internet access!
                </p>
                <a href="/" className="btn">
                    Browse Packages
                </a>
            </div>
        );
    }

    return (
        <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdfa, #ecfccb)', border: '1px solid #a7f3d0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
                <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>Claim Your Free Trial</h3>
                <p className="kv" style={{ marginBottom: 16 }}>
                    Get 1 day of free internet access. No payment required!
                </p>
            </div>

            {/* Quick claim for current device */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                    type="button"
                    className="btn"
                    onClick={handleClaimCurrentDevice}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Get For This Device'}
                </button>
                {portalData?.mac ? (
                    <div className="kv" style={{ alignSelf: 'center', fontSize: 12 }}>
                        Detected: {portalData.mac}
                    </div>
                ) : (
                    <div className="kv" style={{ alignSelf: 'center', fontSize: 12 }}>
                        We will detect your device if you arrived via the hotspot portal.
                    </div>
                )}
            </div>

            <form onSubmit={handleClaimTrial}>
                <div style={{ marginBottom: 20 }}>
                    <label htmlFor="mac">Device MAC Address *</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                            type="text"
                            id="mac"
                            name="mac"
                            value={device.mac}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="AA:BB:CC:DD:EE:FF"
                            required
                            disabled={loading}
                            style={{ flex: 1 }}
                        />
                        {portalData?.mac && (
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={handleConnectCurrentDevice}
                                disabled={loading}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Connect Current Device
                            </button>
                        )}
                    </div>
                    {macError && (
                        <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{macError}</div>
                    )}
                    <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                        Enter a different device's MAC if you want to use the free trial elsewhere. Each device can only use the free trial once.
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label htmlFor="label">Device Label (Optional)</label>
                    <input
                        type="text"
                        id="label"
                        name="label"
                        value={device.label}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="e.g., My Phone, Laptop"
                        disabled={loading}
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
                            This device will be automatically linked to your free trial
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: 20, padding: 12, background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <div className="kv" style={{ color: '#92400e', fontSize: 12 }}>
                        <strong>Terms:</strong> Free trial is limited to 1 day per user. Trial expires automatically after 24 hours.
                    </div>
                </div>

                <div style={{ marginBottom: 20, padding: 12, background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <div className="kv" style={{ color: '#dc2626', fontSize: 12 }}>
                        <strong>Important:</strong> Each device can only use the free trial once. If this device has already used a free trial, it won't be eligible for another one.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        className="btn"
                        disabled={loading || !device.mac.trim()}
                        style={{ flex: 1 }}
                    >
                        {loading ? 'Claiming...' : 'Claim Free Trial'}
                    </button>
                    {showCancel && (
                        <button
                            type="button"
                            className="btn ghost"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

