import { useEffect, useState } from 'react';
import Link from 'next/link';
import { capturePortalDataFromURL, getPortalData } from '../lib/portalData';

export default function Portal() {
    const [mac, setMac] = useState(null);
    const [ip, setIp] = useState(null);
    const [portalData, setPortalData] = useState(null);
    const [deviceRegistered, setDeviceRegistered] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Capture portal data from URL and store in sessionStorage
        const capturedData = capturePortalDataFromURL();
        if (capturedData) {
            setMac(capturedData.mac);
            setIp(capturedData.ip);
            setPortalData(capturedData);

            // Auto-register device if we have MAC address
            if (capturedData.mac) {
                registerDevice(capturedData);
            }
        } else {
            // Try to get existing portal data from sessionStorage
            const existingData = getPortalData();
            if (existingData) {
                setMac(existingData.mac);
                setIp(existingData.ip);
                setPortalData(existingData);
            } else {
                // Fallback: Try to detect device info if no parameters
                detectDeviceInfo();
            }
        }

        // Always try to capture device info when portal loads
        // This works because we have temporary access from MikroTik
        captureDeviceInfo();

        setLoading(false);
    }, []);

    const detectDeviceInfo = async () => {
        try {
            // Try to get device info from backend
            const response = await fetch('/api/devices/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const deviceInfo = await response.json();
                if (deviceInfo.mac || deviceInfo.ip) {
                    setMac(deviceInfo.mac);
                    setIp(deviceInfo.ip);
                    setPortalData(deviceInfo);
                    console.log('Device info detected:', deviceInfo);
                }
            }
        } catch (err) {
            console.log('Device detection not available:', err.message);
        }
    };

    const captureDeviceInfo = async () => {
        try {
            // Get device info from backend
            const response = await fetch('/api/mikrotik/device-info', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Device info detected:', result);

                // Update state with detected info
                if (result.device.mac && !mac) {
                    setMac(result.device.mac);
                }
                if (result.device.ip && !ip) {
                    setIp(result.device.ip);
                }

                // Store device info for later use
                setPortalData({
                    ...portalData,
                    deviceId: result.device.deviceId,
                    mac: result.device.mac,
                    ip: result.device.ip,
                    hasUser: result.device.hasUser
                });

                // Check if device is eligible for free trial
                if (!result.device.hasUser) {
                    checkFreeTrialEligibility(result.device.deviceId);
                }

                // If MAC was auto-generated, show manual input option
                if (result.device.detectionMethod === 'ip-generated') {
                    showManualMacInput();
                }
            }
        } catch (err) {
            console.log('Device detection failed:', err.message);
            showManualMacInput();
        }
    };

    const showManualMacInput = () => {
        const macAddress = prompt(
            'Unable to detect your device MAC address automatically.\n\n' +
            'Please enter your device MAC address (e.g., AA:BB:CC:DD:EE:FF):\n\n' +
            'You can find this in your device WiFi settings or network settings.',
            ''
        );

        if (macAddress && macAddress.trim()) {
            registerManualDevice(macAddress.trim());
        }
    };

    const registerManualDevice = async (macAddress) => {
        try {
            const response = await fetch('/api/mikrotik/manual-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mac: macAddress,
                    ip: ip,
                    userAgent: navigator.userAgent
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Device manually registered:', result);

                // Update state with registered device info
                setMac(result.device.mac);
                setIp(result.device.ip);
                setPortalData({
                    ...portalData,
                    deviceId: result.device.deviceId,
                    mac: result.device.mac,
                    ip: result.device.ip,
                    hasUser: result.device.hasUser
                });

                // Check if device is eligible for free trial
                if (!result.device.hasUser) {
                    checkFreeTrialEligibility(result.device.deviceId);
                }

                alert('✅ Device registered successfully!');
            } else {
                const error = await response.json();
                alert('❌ Device registration failed: ' + error.error);
            }
        } catch (err) {
            console.log('Manual device registration failed:', err.message);
            alert('❌ Device registration failed: ' + err.message);
        }
    };

    const checkFreeTrialEligibility = async (deviceId) => {
        try {
            // Check if device is eligible for free trial
            const response = await fetch('/api/mikrotik/free-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: deviceId,
                    mac: mac,
                    ip: ip
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Free trial check:', result);

                if (result.message === 'Free trial access granted') {
                    // Show free trial success message
                    alert('🎉 Free trial access granted! You have 1 hour of free internet access.');
                } else if (result.message === 'Device already has active subscription') {
                    console.log('Device already has active subscription');
                }
            }
        } catch (err) {
            console.log('Free trial check failed:', err.message);
        }
    };

    const registerDevice = async (deviceData) => {
        try {
            const response = await fetch('/api/devices/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mac: deviceData.mac,
                    ip: deviceData.ip,
                    chapId: deviceData.chapId,
                    chapChallenge: deviceData.chapChallenge,
                    linkLogin: deviceData.linkLogin,
                    linkOrig: deviceData.linkOrig
                })
            });

            if (response.ok) {
                setDeviceRegistered(true);
            }
        } catch (err) {
            console.error('Device registration failed:', err);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                    <p>Setting up your connection...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 720, background: 'white', padding: 22, borderRadius: 12, boxShadow: 'var(--shadow)' }}>
                <h2 style={{ color: 'var(--brand-2)' }}>Welcome to Eco Wifi</h2>

                <p className="kv">
                    Your device has been detected! Choose a package or redeem a voucher to activate internet access.
                </p>

                <div style={{ marginTop: 12, padding: 12, background: '#f0fdfa', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                    <div className="kv" style={{ fontSize: 12, color: '#065f46' }}>
                        <strong>Device detected:</strong> {mac || 'Not available'}
                    </div>
                    <div className="kv" style={{ fontSize: 12, color: '#065f46' }}>
                        <strong>IP Address:</strong> {ip || 'Not available'}
                    </div>
                    {deviceRegistered && (
                        <div className="kv" style={{ fontSize: 12, color: '#059669' }}>
                            ✅ Device registered successfully
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 18 }} className="row">
                    <Link href="/" className="btn">Browse Packages</Link>
                    <Link href="/" className="btn ghost">Redeem Voucher</Link>
                </div>

                <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
                    <p className="kv" style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
                        💡 <strong>Tip:</strong> You can purchase packages without creating an account.
                        If you want to manage your subscriptions later, you can register with your phone number.
                    </p>
                </div>
            </div>
        </div>
    );
}