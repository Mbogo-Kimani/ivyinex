import '../styles/globals.css';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import PopupAd from '../components/PopupAd';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

export default function MyApp({ Component, pageProps }) {
    const [showPopup, setShowPopup] = useState(false);
    const [hasShownPopup, setHasShownPopup] = useState(false);

    useEffect(() => {
        // Track Visit
        const trackVisit = async () => {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ivyinex.onrender.com';
            try {
                await fetch(`${BACKEND_URL}/api/analytics/visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userAgent: navigator.userAgent,
                        referrer: document.referrer,
                        path: window.location.pathname,
                        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
                    })
                });
            } catch (e) { console.error('Tracking error', e); }
        };
        trackVisit();
    }, []);

    const handleAdClick = (ad) => {
        // Track ad interaction
        console.log('Ad clicked:', ad.title);
    };

    return (
        <AuthProvider>
            <ToastProvider>
                <Component {...pageProps} />
                <EmailVerificationBanner />
                {showPopup && (
                    <PopupAd
                        onClose={() => setShowPopup(false)}
                        onAdClick={handleAdClick}
                    />
                )}
            </ToastProvider>
        </AuthProvider>
    );
}


