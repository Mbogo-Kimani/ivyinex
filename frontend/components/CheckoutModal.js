import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { validateMacAddress, normalizeMacAddress } from '../lib/validation';
import * as api from '../lib/api';

/**
 * Checkout modal used to redeem voucher or to start purchase (mpesa disabled)
 * Props:
 *  - open (bool)
 *  - onClose()
 *  - pkg (package object)
 *  - onRedeem({code, mac, ip})
 */
export default function CheckoutModal({ open, onClose, pkg, onRedeem, portalData }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [macError, setMacError] = useState('');
    const [userPoints, setUserPoints] = useState(0);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const { showError, showSuccess } = useToast();
    const { isAuthenticated } = useAuth();

    if (!open || !pkg) return null;

    // Load user points when modal opens
    React.useEffect(() => {
        if (open && isAuthenticated) {
            loadUserPoints();
        }
    }, [open, isAuthenticated]);

    const loadUserPoints = async () => {
        setLoadingPoints(true);
        try {
            const response = await api.getUserPoints();
            setUserPoints(response.points);
        } catch (err) {
            console.error('Failed to load user points:', err);
        } finally {
            setLoadingPoints(false);
        }
    };

    const handleRedeem = async () => {
        setLoading(true);
        setMacError('');

        // Validate MAC address if present
        if (portalData?.mac) {
            const macValidation = validateMacAddress(portalData.mac);
            if (!macValidation.isValid) {
                setMacError(macValidation.message);
                setLoading(false);
                return;
            }
        }

        try {
            const normalizedMac = portalData?.mac ? normalizeMacAddress(portalData.mac) : null;
            await onRedeem({
                code,
                mac: normalizedMac,
                ip: portalData?.ip,
                packageKey: pkg.key
            });
            showSuccess('Voucher redeemed — you should get internet shortly.');
        } catch (err) {
            showError(err.message || 'Voucher redemption failed');
        } finally { setLoading(false); }
    };

    const handleUsePoints = async () => {
        setLoading(true);
        setMacError('');

        // Validate MAC address if present
        if (portalData?.mac) {
            const macValidation = validateMacAddress(portalData.mac);
            if (!macValidation.isValid) {
                setMacError(macValidation.message);
                setLoading(false);
                return;
            }
        }

        try {
            const normalizedMac = portalData?.mac ? normalizeMacAddress(portalData.mac) : null;
            await api.usePoints({
                packageKey: pkg.key,
                mac: normalizedMac,
                ip: portalData?.ip
            });
            showSuccess('Package purchased with points — you should get internet shortly.');
            onClose();
        } catch (err) {
            showError(err.message || 'Points redemption failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal" role="dialog" aria-modal="true">
                <div className="space-between">
                    <h3>Activate Package — {pkg.name}</h3>
                    <button onClick={onClose} className="btn ghost">Close</button>
                </div>

                <p className="kv" style={{ marginTop: 8 }}>
                    Choose how you want to activate this package:
                </p>

                {portalData?.mac && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f0fdfa', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                        <div className="kv" style={{ fontSize: 12, color: '#065f46' }}>
                            <strong>Device detected:</strong> {portalData.mac}
                        </div>
                        {macError && (
                            <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{macError}</div>
                        )}
                    </div>
                )}

                {/* Voucher Code Input - Always show */}
                <div style={{ marginTop: 16 }}>
                    <label>Voucher Code</label>
                    <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC12345" />
                </div>

                {/* Points Information - Show if package supports points and user is authenticated */}
                {isAuthenticated && pkg.pointsRequired > 0 && (
                    <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #0ea5e9' }}>
                        <div className="kv" style={{ fontSize: 14, color: '#0c4a6e' }}>
                            <strong>Your Points:</strong> {loadingPoints ? 'Loading...' : userPoints}
                        </div>
                        <div className="kv" style={{ fontSize: 12, color: '#0c4a6e', marginTop: 4 }}>
                            {userPoints >= pkg.pointsRequired
                                ? `✅ You have enough points to purchase this package`
                                : `❌ You need ${pkg.pointsRequired - userPoints} more points`
                            }
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 16 }} className="row">
                    {/* Voucher Redeem Button - Always show */}
                    <button className="btn" onClick={handleRedeem} disabled={loading || !code}>
                        {loading ? 'Sending...' : 'Redeem Voucher'}
                    </button>

                    {/* Use Points Button - Show if user has enough points */}
                    {isAuthenticated && pkg.pointsRequired > 0 && userPoints >= pkg.pointsRequired && (
                        <button
                            className="btn"
                            onClick={handleUsePoints}
                            disabled={loading}
                            style={{ background: '#10b981', color: 'white', border: 'none' }}
                        >
                            {loading ? 'Processing...' : `Use ${pkg.pointsRequired} Points`}
                        </button>
                    )}

                    <button className="btn ghost" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
