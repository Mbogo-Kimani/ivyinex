/**
 * Device Add Form Component
 * Form for adding devices to subscriptions
 */

import { useState, useEffect } from 'react';
import { validateMacAddress, normalizeMacAddress } from '../lib/validation';
import { getPortalData } from '../lib/portalData';

export default function DeviceAddForm({
    subscriptions = [],
    onSubmit,
    onCancel,
    loading = false,
    showSubscription = true
}) {
    const [formData, setFormData] = useState({
        mac: '',
        label: '',
        subscriptionId: ''
    });
    const [errors, setErrors] = useState({});
    const [portalData, setPortalData] = useState(null);

    useEffect(() => {
        // Get portal data if available
        const data = getPortalData();
        if (data) {
            setPortalData(data);
            setFormData(prev => ({ ...prev, mac: data.mac || '' }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'mac' ? value.toUpperCase() : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        // Validate MAC address
        const macValidation = validateMacAddress(formData.mac);
        if (!macValidation.isValid) {
            setErrors(prev => ({ ...prev, mac: macValidation.message }));
            return;
        }

        // Validate subscription selection
        if (showSubscription && !formData.subscriptionId) {
            setErrors(prev => ({ ...prev, subscriptionId: 'Please select a subscription' }));
            return;
        }

        // Prepare device data
        const deviceData = {
            mac: normalizeMacAddress(formData.mac),
            label: formData.label.trim() || 'Unnamed Device',
            autoCapture: !!portalData?.mac
        };

        onSubmit(deviceData, formData.subscriptionId);
    };

    const handleCancel = () => {
        setFormData({ mac: '', label: '', subscriptionId: '' });
        setErrors({});
        if (onCancel) onCancel();
    };

    const activeSubscriptions = subscriptions.filter(sub => {
        const now = new Date();
        const endDate = new Date(sub.endAt);
        return sub.status !== 'cancelled' && sub.status !== 'pending' && endDate > now;
    });

    return (
        <form onSubmit={handleSubmit}>
            {showSubscription && (
                <div style={{ marginBottom: 20 }}>
                    <label htmlFor="subscription">Subscription *</label>
                    <select
                        id="subscription"
                        name="subscriptionId"
                        value={formData.subscriptionId}
                        onChange={handleInputChange}
                        className="input"
                        required
                    >
                        <option value="">Select a subscription</option>
                        {activeSubscriptions.map(sub => (
                            <option key={sub._id} value={sub._id}>
                                {sub.packageName || sub.packageKey} - {Math.round(sub.speedKbps / 1000 * 10) / 10} Mbps
                            </option>
                        ))}
                    </select>
                    {errors.subscriptionId && (
                        <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.subscriptionId}</div>
                    )}
                    <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                        Select which subscription this device should be linked to
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
                <label htmlFor="mac">Device MAC Address *</label>
                <input
                    type="text"
                    id="mac"
                    name="mac"
                    value={formData.mac}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    required
                    disabled={loading}
                />
                {errors.mac && (
                    <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.mac}</div>
                )}
                <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                    The MAC address identifies which device can use this subscription
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label htmlFor="label">Device Label (Optional)</label>
                <input
                    type="text"
                    id="label"
                    name="label"
                    value={formData.label}
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
                        This device will be automatically linked
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    type="submit"
                    className="btn"
                    disabled={loading || !formData.mac.trim() || (showSubscription && !formData.subscriptionId)}
                >
                    {loading ? 'Adding...' : 'Add Device'}
                </button>
                <button
                    type="button"
                    className="btn ghost"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}






















