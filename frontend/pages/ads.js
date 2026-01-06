import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';

export default function Ads() {
    const router = useRouter();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoReconnected, setAutoReconnected] = useState(false);

    useEffect(() => {
        // Check for auto-reconnection parameter
        if (router.query['auto-reconnected'] === 'true') {
            setAutoReconnected(true);
        }

        // Simulate loading ads from API
        setTimeout(() => {
            setAds([
                {
                    id: 1,
                    title: 'Back-to-School Special',
                    content: 'Get 20% off on all 7-day packages! Perfect for students returning to school.',
                    type: 'promo',
                    cta: 'Get Discount',
                    image: '🎓',
                    featured: true
                },
                {
                    id: 2,
                    title: 'Mary\'s Refreshments',
                    content: 'Buy any drink from Mary\'s Stall and get a free 30-minute voucher! Located near the main gate.',
                    type: 'partner',
                    cta: 'Visit Stall',
                    image: '🥤',
                    featured: false
                },
                {
                    id: 3,
                    title: 'Community Cleanup',
                    content: 'Join us this Saturday for our monthly community cleanup. Free internet for all volunteers!',
                    type: 'community',
                    cta: 'Join Event',
                    image: '🌱',
                    featured: false
                },
                {
                    id: 4,
                    title: 'Local Business Directory',
                    content: 'Discover local businesses in our area. Many offer special discounts for Wifi Mtaani users!',
                    type: 'directory',
                    cta: 'Browse Directory',
                    image: '🏪',
                    featured: false
                },
                {
                    id: 5,
                    title: 'Tech Support Available',
                    content: 'Having connection issues? Our tech support team is available 24/7. Contact us for help!',
                    type: 'support',
                    cta: 'Get Help',
                    image: '🔧',
                    featured: false
                },
                {
                    id: 6,
                    title: 'Referral Program',
                    content: 'Refer a friend and both of you get 1 hour of free internet! Share your referral code with friends.',
                    type: 'referral',
                    cta: 'Share Code',
                    image: '👥',
                    featured: true
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

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
                            <Link href="/account" className="btn ghost" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
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
                                    <div key={ad.id} style={{
                                        background: 'var(--wifi-mtaani-panel)',
                                        padding: 20,
                                        borderRadius: 12,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        border: '2px solid var(--wifi-mtaani-accent)',
                                        position: 'relative',
                                        color: 'white'
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
                                                color: 'white'
                                            }}>
                                                {ad.image}
                                            </div>
                                            <h3 style={{ margin: 0, color: 'var(--wifi-mtaani-accent)', fontWeight: 600 }}>{ad.title}</h3>
                                        </div>
                                        <p style={{ marginBottom: 16, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>{ad.content}</p>
                                        <button className="btn" style={{ width: '100%' }}>
                                            {ad.cta}
                                        </button>
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
                                    <div key={ad.id} style={{
                                        background: 'var(--wifi-mtaani-panel)',
                                        padding: 20,
                                        borderRadius: 12,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(47, 231, 245, 0.2)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        color: 'white'
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
                                                {ad.image}
                                            </div>
                                            <h3 style={{ margin: 0, color: 'var(--wifi-mtaani-accent)', fontSize: 16, fontWeight: 600 }}>{ad.title}</h3>
                                        </div>
                                        <p style={{ marginBottom: 16, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, fontSize: 14 }}>{ad.content}</p>
                                        <button className="btn ghost" style={{ width: '100%', fontSize: 14 }}>
                                            {ad.cta}
                                        </button>
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
        </>
    );
}
