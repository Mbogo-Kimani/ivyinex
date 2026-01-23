import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

export default function Ads() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { showError } = useToast();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoReconnected, setAutoReconnected] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ivyinex.onrender.com';

    useEffect(() => {
        // Check for auto-reconnection parameter
        if (router.query['auto-reconnected'] === 'true') {
            setAutoReconnected(true);
        }

        // Fetch ads from API
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/ads`);
            const data = await response.json();

            if (data.ok && data.ads) {
                // Filter active ads
                const now = new Date();
                const activeAds = data.ads.filter(ad => {
                    if (!ad.active) return false;
                    if (ad.startDate && new Date(ad.startDate) > now) return false;
                    if (ad.endDate && new Date(ad.endDate) < now) return false;
                    return true;
                });
                setAds(activeAds);
            }
        } catch (error) {
            console.error('Failed to fetch ads:', error);
            // Fallback to empty array on error
            setAds([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdClick = async (ad) => {
        // Track click
        try {
            await fetch(`${BACKEND_URL}/api/ads/${ad._id}/click`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Failed to track ad click:', error);
        }

        // Open link if available
        if (ad.link) {
            window.open(ad.link, '_blank', 'noopener,noreferrer');
        }
    };

    const handleMyAccountClick = (e) => {
        if (!isAuthenticated) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    const featuredAds = ads.filter(ad => ad.featured);
    const regularAds = ads.filter(ad => !ad.featured);

    return (
        <>
            <Header />
            <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
                <div className="container">
                    {/* Welcome Section */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--wifi-mtaani-primary) 0%, var(--wifi-mtaani-accent) 100%)',
                        color: 'white',
                        padding: 24,
                        borderRadius: 16,
                        marginBottom: 24,
                        textAlign: 'center',
                        boxShadow: '0 8px 24px rgba(47, 231, 245, 0.3)'
                    }}>
                        <h1 style={{ marginBottom: 8, fontSize: 32, fontWeight: 700 }}>
                            {autoReconnected ? '🔄 Welcome Back!' : '🎉 You\'re Connected!'}
                        </h1>
                        <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                            Tap.Pay.Connect.
                        </p>
                        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 16 }}>
                            {autoReconnected
                                ? 'You\'ve been automatically reconnected! Your subscription is still active.'
                                : 'Welcome to Wifi Mtaani! Check out our latest promotions and community updates below.'
                            }
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                                Browse More Packages
                            </Link>
                            <Link
                                href="/account"
                                className="btn ghost"
                                onClick={handleMyAccountClick}
                                style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                            >
                                My Account
                            </Link>
                        </div>
                    </div>

                    {/* Featured Promotions */}
                    {featuredAds.length > 0 && (
                        <section style={{ marginBottom: 32 }}>
                            <h2 style={{ marginBottom: 16, color: 'var(--wifi-mtaani-accent)', fontWeight: 600 }}>🔥 Featured Promotions</h2>
                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                {featuredAds.map(ad => (
                                    <div
                                        key={ad._id || ad.id}
                                        onClick={() => handleAdClick(ad)}
                                        style={{
                                            background: 'var(--wifi-mtaani-panel)',
                                            padding: 20,
                                            borderRadius: 12,
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                            border: '2px solid var(--wifi-mtaani-accent)',
                                            position: 'relative',
                                            color: 'white',
                                            cursor: ad.link ? 'pointer' : 'default'
                                        }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: -8,
                                            right: 12,
                                            background: 'var(--accent)',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: 12,
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>
                                            FEATURED
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                            <div style={{
                                                fontSize: 32,
                                                marginRight: 12,
                                                width: 48,
                                                height: 48,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--brand-1)',
                                                borderRadius: 12,
                                                color: 'white',
                                                overflow: 'hidden'
                                            }}>
                                                {ad.imageUrl ? (
                                                    <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    ad.image || '📢'
                                                )}
                                            </div>
                                            <h3 style={{ margin: 0, color: 'var(--wifi-mtaani-accent)', fontWeight: 600 }}>{ad.title}</h3>
                                        </div>
                                        <p style={{ marginBottom: 16, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>{ad.content}</p>
                                        {ad.link && (
                                            <button className="btn" style={{ width: '100%' }} onClick={(e) => { e.stopPropagation(); handleAdClick(ad); }}>
                                                {ad.cta || 'Learn More'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Regular Ads */}
                    <section>
                        <h2 style={{ marginBottom: 16, color: 'var(--wifi-mtaani-accent)', fontWeight: 600 }}>📢 Community Updates</h2>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                                <p>Loading promotions...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                                {regularAds.map(ad => (
                                    <div
                                        key={ad._id || ad.id}
                                        onClick={() => handleAdClick(ad)}
                                        style={{
                                            background: 'var(--wifi-mtaani-panel)',
                                            padding: 20,
                                            borderRadius: 12,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(47, 231, 245, 0.2)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            color: 'white',
                                            cursor: ad.link ? 'pointer' : 'default'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(47, 231, 245, 0.3)';
                                            e.currentTarget.style.borderColor = 'var(--wifi-mtaani-accent)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                                            e.currentTarget.style.borderColor = 'rgba(47, 231, 245, 0.2)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                            <div style={{
                                                fontSize: 24,
                                                marginRight: 12,
                                                width: 40,
                                                height: 40,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--brand-1)',
                                                borderRadius: 8,
                                                color: 'white'
                                            }}>
                                                {ad.imageUrl ? (
                                                    <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                                                ) : (
                                                    ad.image || '📢'
                                                )}
                                            </div>
                                            <h3 style={{ margin: 0, color: 'var(--wifi-mtaani-accent)', fontSize: 16, fontWeight: 600 }}>{ad.title}</h3>
                                        </div>
                                        <p style={{ marginBottom: 16, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, fontSize: 14 }}>{ad.content}</p>
                                        {ad.link && (
                                            <button className="btn ghost" style={{ width: '100%', fontSize: 14 }} onClick={(e) => { e.stopPropagation(); handleAdClick(ad); }}>
                                                {ad.cta || 'Learn More'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Footer Info */}
                    <div style={{
                        marginTop: 32,
                        padding: 20,
                        background: 'var(--wifi-mtaani-panel)',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: '1px solid rgba(47, 231, 245, 0.2)'
                    }}>
                        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 }}>
                            💡 <strong>Tip:</strong> This ad space generates revenue for Wifi Mtaani.
                            Local businesses can advertise here to reach our community of users.
                        </p>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                title="Login Required"
                message="You need to be logged in to view your account details. Please login or create an account to continue."
                redirectPath="/account"
            />
        </>
    );
}
