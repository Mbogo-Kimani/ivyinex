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
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [macError, setMacError] = useState('');
    const [userPoints, setUserPoints] = useState(0);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const { showError, showSuccess } = useToast();
    const { isAuthenticated } = useAuth();
    const router = require('next/router').useRouter();

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

    const handleMpesaBuy = async () => {
        setLoading(true);
        try {
            // Validate phone
            const cleanPhone = phone.replace(/\D/g, '');
            // Basic validation
            if (cleanPhone.length < 9) {
                throw new Error('Please enter a valid phone number');
            }

            // Start checkout
            const normalizedMac = portalData?.mac ? normalizeMacAddress(portalData.mac) : null;

            const res = await api.startCheckout({
                phone,
                packageKey: pkg.key,
                mac: normalizedMac,
                ip: portalData?.ip
            });

            // If successful, we get a paymentId (and maybe checkoutRequestID)
            if (res.paymentId) {
                // Store pending payment ID
                localStorage.setItem('pendingPaymentId', res.paymentId);

                showSuccess('STK Push sent! Check your phone.');
                onClose();

                // Redirect to success page (which is now pending/polling page)
                router.push(`/checkout/success?paymentId=${res.paymentId}`);
            } else {
                showError('Failed to initiate payment. No payment ID returned.');
            }

        } catch (err) {
            showError(err.message || 'M-Pesa checkout failed');
        } finally {
            setLoading(false);
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
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(33, 175, 233, 0.1)', borderRadius: 8, border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                        <div style={{ fontSize: 12, color: 'var(--wifi-mtaani-accent)' }}>
                            <strong>Device detected:</strong> {portalData.mac}
                        </div>
                        {macError && (
                            <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{macError}</div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 24, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--wifi-mtaani-accent)' }}>Pay with M-Pesa</h4>
                    <div className="row" style={{ gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <input
                                className="input"
                                type="tel"
                                placeholder="07XX XXX XXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn"
                            style={{ background: '#25D366', borderColor: '#25D366', color: '#000' }}
                            onClick={handleMpesaBuy}
                            disabled={loading || !phone || phone.length < 9}
                        >
                            {loading ? 'Processing...' : `Pay KES ${pkg.priceKES}`}
                        </button>
                    </div>
                </div>

                <p className="kv" style={{ marginTop: 20, marginBottom: 8, textAlign: 'center' }}>
                    — OR Redeem Voucher —
                </p>

                {/* Voucher Code Input */}
                <div style={{ marginTop: 8 }}>
                    <label>Voucher Code</label>
                    <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC12345" />
                </div>

                {/* Points Information */}
                {isAuthenticated && pkg.pointsRequired > 0 && (
                    <div style={{ marginTop: 16, padding: 12, background: 'rgba(33, 175, 233, 0.1)', borderRadius: 8, border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                        <div style={{ fontSize: 14, color: 'var(--wifi-mtaani-accent)' }}>
                            <strong>Your Points:</strong> {loadingPoints ? 'Loading...' : userPoints}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }}>
                            {userPoints >= pkg.pointsRequired
                                ? `✅ You have enough points to purchase this package`
                                : `❌ You need ${pkg.pointsRequired - userPoints} more points`
                            }
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 16 }} className="row">
                    {/* Voucher Redeem Button */}
                    <button className="btn" onClick={handleRedeem} disabled={loading || !code} style={{ flex: 1 }}>
                        {loading ? 'Sending...' : 'Redeem Voucher'}
                    </button>
                </div>

                {/* Use Points Button */}
                {isAuthenticated && pkg.pointsRequired > 0 && userPoints >= pkg.pointsRequired && (
                    <div style={{ marginTop: 10 }}>
                        <button
                            className="btn full-width"
                            onClick={handleUsePoints}
                            disabled={loading}
                            style={{ background: '#10b981', color: 'white', border: 'none' }}
                        >
                            {loading ? 'Processing...' : `Purchase with ${pkg.pointsRequired} Points`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
