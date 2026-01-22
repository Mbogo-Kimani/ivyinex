import '../styles/globals.css';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import PopupAd from '../components/PopupAd';

export default function MyApp({ Component, pageProps }) {
    const [showPopup, setShowPopup] = useState(false);
    const [hasShownPopup, setHasShownPopup] = useState(false);

    useEffect(() => {
        // Check if we've already shown popup in this session
        const popupShown = sessionStorage.getItem('popupAdShown');
        if (!popupShown) {
            // Show popup after a short delay (2 seconds)
            const timer = setTimeout(() => {
                setShowPopup(true);
                sessionStorage.setItem('popupAdShown', 'true');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAdClick = (ad) => {
        // Track ad interaction
        console.log('Ad clicked:', ad.title);
    };

    return (
        <AuthProvider>
            <ToastProvider>
                <Component {...pageProps} />
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
