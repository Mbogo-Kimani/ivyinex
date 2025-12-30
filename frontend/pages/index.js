import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import PackageCard from '../components/PackageCard';
import CheckoutModal from '../components/CheckoutModal';
import VoucherModal from '../components/VoucherModal';
import AuthModal from '../components/AuthModal';
import * as api from '../lib/api';
import { capturePortalDataFromURL, getPortalData } from '../lib/portalData';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

// Dynamically import FreeTrialBanner to prevent SSR issues
const FreeTrialBanner = dynamic(() => import('../components/FreeTrialBanner'), {
    ssr: false,
    loading: () => null
});

/**
 * Home page lists packages and allows voucher redemption.
 * This page is also used when user visits from the captive portal,
 * the captive portal should redirect to /portal?mac=AA:BB:CC&ip=192.168.88.101
 */

export default function Home() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [voucherOpen, setVoucherOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [portalData, setPortalData] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const { showError, showSuccess } = useToast();

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        loadPackages();
        // capture portal data from query if present (client-side)
        const capturedData = capturePortalDataFromURL();
        if (capturedData) {
            setPortalData(capturedData);
        } else {
            // Try to get existing portal data from sessionStorage
            const existingData = getPortalData();
            if (existingData) {
                setPortalData(existingData);
            } else {
                // If no portal data, try to detect device info from backend
                detectDeviceFromBackend();
            }
        }
    }, []);

    const detectDeviceFromBackend = async () => {
        try {
            const response = await fetch('/api/mikrotik/device-info', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Device info detected from backend:', result);

                if (result.device) {
                    const deviceData = {
                        mac: result.device.mac,
                        ip: result.device.ip,
                        deviceId: result.device.deviceId,
                        hasUser: result.device.hasUser,
                        detectionMethod: result.device.detectionMethod
                    };

                    setPortalData(deviceData);

                    // Store in sessionStorage for persistence
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('eco.portalData', JSON.stringify(deviceData));
                    }

                    // If device is new and not linked to user, offer free trial
                    if (!result.device.hasUser && result.device.detectionMethod !== 'manual-input') {
                        checkFreeTrialEligibility(result.device.deviceId);
                    }
                }
            }
        } catch (err) {
            console.log('Backend device detection failed:', err.message);
            // If backend detection fails, show manual input option
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
                    ip: portalData?.ip,
                    userAgent: navigator.userAgent
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Device manually registered:', result);

                const deviceData = {
                    mac: result.device.mac,
                    ip: result.device.ip,
                    deviceId: result.device.deviceId,
                    hasUser: result.device.hasUser,
                    detectionMethod: result.device.detectionMethod
                };

                setPortalData(deviceData);

                // Store in sessionStorage for persistence
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('eco.portalData', JSON.stringify(deviceData));
                }

                showSuccess('✅ Device registered successfully!');

                // Check if device is eligible for free trial
                if (!result.device.hasUser) {
                    checkFreeTrialEligibility(result.device.deviceId);
                }
            } else {
                const error = await response.json();
                showError('❌ Device registration failed: ' + error.error);
            }
        } catch (err) {
            console.log('Manual device registration failed:', err.message);
            showError('❌ Device registration failed: ' + err.message);
        }
    };

    const checkFreeTrialEligibility = async (deviceId) => {
        try {
            const response = await fetch('/api/mikrotik/free-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: deviceId,
                    mac: portalData?.mac,
                    ip: portalData?.ip
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Free trial check:', result);

                if (result.message === 'Free trial access granted') {
                    showSuccess('🎉 Free trial access granted! You have 1 hour of free internet access.');
                }
            }
        } catch (err) {
            console.log('Free trial check failed:', err.message);
        }
    };

    async function loadPackages() {
        try {
            const pkgs = await api.fetchPackages();

            // Additional safeguard: ensure no duplicate packages by key
            const uniquePackages = pkgs.reduce((acc, pkg) => {
                const existingIndex = acc.findIndex(existing => existing.key === pkg.key);
                if (existingIndex === -1) {
                    acc.push(pkg);
                } else {
                    // If duplicate found, keep the one with more complete data
                    const existing = acc[existingIndex];
                    if (pkg._id && !existing._id) {
                        acc[existingIndex] = pkg; // Replace with more complete data
                    }
                }
                return acc;
            }, []);

            console.log(`Loaded ${pkgs.length} packages, ${uniquePackages.length} unique packages`);
            setPackages(uniquePackages);
        } catch (err) {
            showError('Failed to load packages');
        } finally {
            setLoading(false);
        }
    }

    async function handleBuy(pkg) {
        // For now MPESA button is disabled by design.
        // We'll open the checkout modal which supports voucher flow.
        setSelectedPkg(pkg);
        setCheckoutOpen(true);
    }

    async function handleRedeem({ code, mac, ip, packageKey }) {
        // call backend redeem
        try {
            const payload = { code, mac, ip, userId: null, packageKey };
            // If packageKey not passed, backend redeem uses voucher only
            const res = await api.redeemVoucher(payload);
            showSuccess('🎉 You are now connected! Enjoy your internet access.');
            setCheckoutOpen(false);
            // redirect to ads page after short delay
            setTimeout(() => { window.location.href = '/ads'; }, 2000);
            return res;
        } catch (err) {
            throw err;
        }
    }

    function handleFreeTrial(pkg) {
        if (!isAuthenticated) {
            setAuthModalOpen(true);
        } else {
            // Redirect to free trial page
            router.push('/account/free-trial');
        }
    }

    return (
        <>
            <Header onOpenVoucher={() => setVoucherOpen(true)} portalData={portalData} />

            <main className="container">
                {/* Free Trial Banner - Only render on client side */}
                {isClient && <FreeTrialBanner />}

                <section className="hero">
                    <div style={{ flex: 1 }} className="hero-text">
                        <h1>Welcome to Ivynex Wi-Fi</h1>
                        <p style={{ fontSize: 18, color: 'var(--ivynex-accent)', fontWeight: 500, marginBottom: 16 }}>Tap.Pay.Connect.</p>
                        <p>Choose a package and get online instantly. For now, use vouchers to activate a package on your device.</p>
                        <div style={{ marginTop: 12 }} className="row">
                            <Link href="/ads" className="btn ghost">See Ads & Promos</Link>
                            <button className="btn" onClick={() => setVoucherOpen(true)}>Redeem Voucher</button>
                        </div>
                        <p className="kv" style={{ marginTop: 10 }}>Tip: If you connected through the hotspot captive portal, your device MAC/IP will be auto-detected.</p>
                    </div>
                    <div style={{ width: 200 }} className="center">
                        <div style={{ textAlign: 'center' }}>
                            <div className="kv" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>SSID: <strong style={{ color: 'var(--ivynex-accent)' }}>Ivynex Wi-Fi</strong></div>
                        </div>
                    </div>
                </section>

                <section style={{ marginTop: 18 }}>
                    <div className="space-between" style={{ marginBottom: 10 }}>
                        <h2 style={{ fontSize: 20 }}>Available Packages</h2>
                        <div className="kv">Select a package and redeem voucher</div>
                    </div>

                    {loading ? (
                        <div className="center" style={{ padding: 40 }}>Loading packages…</div>
                    ) : (
                        <div className="grid">
                            {packages.map(pkg => (
                                <PackageCard
                                    key={pkg.key}
                                    pkg={pkg}
                                    onBuy={handleBuy}
                                    onFreeTrial={handleFreeTrial}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="footer">
                    <div style={{ color: 'var(--ivynex-accent)', fontWeight: 500 }}>© Ivynex — Tap.Pay.Connect.</div>
                    <div style={{ marginTop: 8, color: 'var(--ivynex-muted)' }}>© {new Date().getFullYear()} · Premium ISP hotspot portal</div>
                </section>
            </main>

            {checkoutOpen && <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} pkg={selectedPkg} onRedeem={handleRedeem} portalData={portalData} />}

            {voucherOpen && <VoucherModal open={voucherOpen} onClose={() => setVoucherOpen(false)} onRedeem={handleRedeem} portalData={portalData} />}

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                title="Sign In Required"
                message="Please sign in or create an account to claim your free trial."
                redirectPath="/account/free-trial"
            />
        </>
    );
}
