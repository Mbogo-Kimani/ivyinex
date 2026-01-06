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
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                    <p>Connecting you to Wifi Mtaani…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ width: '100%', maxWidth: 720, background: 'var(--wifi-mtaani-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h2 style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>Welcome to Wifi Mtaani Wi-Fi</h2>
                    <p style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 18, fontWeight: 500 }}>Tap.Pay.Connect.</p>
                </div>

                <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                    Your device has been detected! Choose a package or redeem a voucher to activate internet access.
                </p>

                <div style={{ marginTop: 20, padding: 16, background: 'rgba(33, 175, 233, 0.1)', borderRadius: 12, border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                    <div style={{ fontSize: 14, color: 'var(--wifi-mtaani-accent)', marginBottom: 8 }}>
                        <strong>Device detected:</strong> {mac || 'Not available'}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--wifi-mtaani-accent)', marginBottom: 8 }}>
                        <strong>IP Address:</strong> {ip || 'Not available'}
                    </div>
                    {deviceRegistered && (
                        <div style={{ fontSize: 14, color: '#10b981', marginTop: 8 }}>
                            ✅ Device registered successfully
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 24, justifyContent: 'center', gap: 12 }} className="row">
                    <Link href="/" className="btn" style={{ fontSize: 16, padding: '12px 24px' }}>Get Online</Link>
                    <Link href="/" className="btn ghost" style={{ fontSize: 16, padding: '12px 24px' }}>Redeem Voucher</Link>
                </div>

                <div style={{ marginTop: 20, padding: 16, background: 'rgba(47, 231, 245, 0.1)', borderRadius: 12, border: '1px solid rgba(47, 231, 245, 0.2)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', margin: 0, textAlign: 'center' }}>
                        💡 <strong>Tip:</strong> You can purchase packages without creating an account.
                        If you want to manage your subscriptions later, you can register with your phone number.
                    </p>
                </div>
            </div>
        </div>
    );
}