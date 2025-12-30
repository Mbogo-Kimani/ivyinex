/**
 * Device List Component
 * Displays and manages devices for a subscription
 */

import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { validateMacAddress, normalizeMacAddress } from '../lib/validation';
import { getPortalData } from '../lib/portalData';

export default function DeviceList({
    devices = [],
    subscriptionId,
    onAddDevice,
    onRemoveDevice,
    onUpdateDevice,
    maxDevices = 1,
    loading = false
}) {
    const { showError } = useToast();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [newDevice, setNewDevice] = useState({ mac: '', label: '' });
    const [editDevice, setEditDevice] = useState({ mac: '', label: '' });
    const [portalData, setPortalData] = useState(null);

    // Check if we can add more devices
    const canAddDevice = devices.length < maxDevices;

    // Get portal data on mount
    useState(() => {
        const data = getPortalData();
        if (data) {
            setPortalData(data);
            setNewDevice(prev => ({ ...prev, mac: data.mac || '' }));
        }
    }, []);

    const handleAddDevice = async (e) => {
        e.preventDefault();

        // Validate MAC address
        const macValidation = validateMacAddress(newDevice.mac);
        if (!macValidation.isValid) {
            showError(macValidation.message);
            return;
        }

        try {
            const deviceData = {
                mac: normalizeMacAddress(newDevice.mac),
                label: newDevice.label.trim() || 'Unnamed Device',
                autoCapture: !!portalData?.mac
            };

            await onAddDevice(deviceData);
            setNewDevice({ mac: '', label: '' });
            setShowAddForm(false);
        } catch (err) {
            showError(err.message || 'Failed to add device');
        }
    };

    const handleUpdateDevice = async (e) => {
        e.preventDefault();

        // Validate MAC address
        const macValidation = validateMacAddress(editDevice.mac);
        if (!macValidation.isValid) {
            showError(macValidation.message);
            return;
        }

        try {
            const deviceData = {
                mac: normalizeMacAddress(editDevice.mac),
                label: editDevice.label.trim() || 'Unnamed Device'
            };

            await onUpdateDevice(editingDevice.id, deviceData);
            setEditingDevice(null);
            setEditDevice({ mac: '', label: '' });
        } catch (err) {
            showError(err.message || 'Failed to update device');
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        if (!confirm('Are you sure you want to remove this device?')) return;

        try {
            await onRemoveDevice(deviceId);
        } catch (err) {
            showError(err.message || 'Failed to remove device');
        }
    };

    const startEdit = (device) => {
        setEditingDevice(device);
        setEditDevice({
            mac: device.mac,
            label: device.label || ''
        });
    };

    const cancelEdit = () => {
        setEditingDevice(null);
        setEditDevice({ mac: '', label: '' });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="kv">Loading devices...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: 'var(--brand-2)', fontSize: 24 }}>Linked Devices</h2>
                {canAddDevice && (
                    <button
                        className="btn"
                        onClick={() => setShowAddForm(true)}
                        style={{ padding: '8px 16px' }}
                    >
                        Add Device
                    </button>
                )}
            </div>

            {/* Device List */}
            {devices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 8 }}>No Devices Linked</h3>
                    <p className="kv" style={{ marginBottom: 16 }}>
                        Add devices to use this subscription
                    </p>
                    {canAddDevice && (
                        <button
                            className="btn"
                            onClick={() => setShowAddForm(true)}
                        >
                            Add Your First Device
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {devices.map((device, index) => (
                        <div key={device.id || index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            {editingDevice?.id === device.id ? (
                                <form onSubmit={handleUpdateDevice} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={editDevice.mac}
                                            onChange={(e) => setEditDevice(prev => ({ ...prev, mac: e.target.value.toUpperCase() }))}
                                            className="input"
                                            placeholder="AA:BB:CC:DD:EE:FF"
                                            style={{ marginBottom: 8 }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={editDevice.label}
                                            onChange={(e) => setEditDevice(prev => ({ ...prev, label: e.target.value }))}
                                            className="input"
                                            placeholder="Device label"
                                        />
                                    </div>
                                    <button type="submit" className="btn" style={{ padding: '6px 12px' }}>
                                        Save
                                    </button>
                                    <button type="button" className="btn ghost" onClick={cancelEdit} style={{ padding: '6px 12px' }}>
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div>
                                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>
                                            {device.mac}
                                        </div>
                                        <div className="kv" style={{ fontSize: 12 }}>
                                            {device.label || 'Unnamed Device'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            className="btn ghost"
                                            onClick={() => startEdit(device)}
                                            style={{ padding: '6px 12px' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn ghost"
                                            onClick={() => handleRemoveDevice(device.id || index)}
                                            style={{ padding: '6px 12px', color: '#ef4444' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Device Limit Warning */}
            {!canAddDevice && devices.length >= maxDevices && (
                <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b'
                }}>
                    <div className="kv" style={{ color: '#92400e', fontSize: 14 }}>
                        <strong>Device limit reached:</strong> This subscription allows {maxDevices} device{maxDevices > 1 ? 's' : ''}.
                        Remove a device to add a new one.
                    </div>
                </div>
            )}

            {/* Add Device Modal */}
            {showAddForm && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>Add Device</h3>

                        <form onSubmit={handleAddDevice}>
                            <div style={{ marginBottom: 20 }}>
                                <label htmlFor="mac">Device MAC Address *</label>
                                <input
                                    type="text"
                                    id="mac"
                                    value={newDevice.mac}
                                    onChange={(e) => setNewDevice(prev => ({ ...prev, mac: e.target.value.toUpperCase() }))}
                                    className="input"
                                    placeholder="AA:BB:CC:DD:EE:FF"
                                    required
                                />
                                <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                                    The MAC address identifies which device can use this subscription
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label htmlFor="label">Device Label (Optional)</label>
                                <input
                                    type="text"
                                    id="label"
                                    value={newDevice.label}
                                    onChange={(e) => setNewDevice(prev => ({ ...prev, label: e.target.value }))}
                                    className="input"
                                    placeholder="e.g., My Phone, Laptop"
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
                                    disabled={!newDevice.mac.trim()}
                                >
                                    Add Device
                                </button>
                                <button
                                    type="button"
                                    className="btn ghost"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewDevice({ mac: '', label: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}






















