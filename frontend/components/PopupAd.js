import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ivyinex.onrender.com';

export default function PopupAd({ onClose, onAdClick }) {
    const [ads, setAds] = useState([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dismissedAds, setDismissedAds] = useState([]);

    useEffect(() => {
        fetchPopupAds();
        
        // Load dismissed ads from localStorage
        const dismissed = localStorage.getItem('dismissedPopupAds');
        if (dismissed) {
            try {
                setDismissedAds(JSON.parse(dismissed));
            } catch (e) {
                console.error('Failed to parse dismissed ads', e);
            }
        }
    }, []);

    const fetchPopupAds = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/ads/popup`);
            const data = await response.json();
            
            if (data.ok && data.ads) {
                // Filter out dismissed ads
                const activeAds = data.ads.filter(ad => 
                    !dismissedAds.includes(ad._id) && 
                    isAdActive(ad)
                );
                setAds(activeAds);
            }
        } catch (error) {
            console.error('Failed to fetch popup ads:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAdActive = (ad) => {
        if (!ad.active) return false;
        const now = new Date();
        if (ad.startDate && new Date(ad.startDate) > now) return false;
        if (ad.endDate && new Date(ad.endDate) < now) return false;
        return true;
    };

    const handleDismiss = (adId) => {
        const newDismissed = [...dismissedAds, adId];
        setDismissedAds(newDismissed);
        localStorage.setItem('dismissedPopupAds', JSON.stringify(newDismissed));
        
        // Move to next ad or close
        if (currentAdIndex < ads.length - 1) {
            setCurrentAdIndex(currentAdIndex + 1);
        } else {
            onClose();
        }
    };

    const handleAdClick = async (ad) => {
        // Track click
        if (onAdClick) {
            onAdClick(ad);
        }
        
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

    if (loading || ads.length === 0) {
        return null;
    }

    const currentAd = ads[currentAdIndex];
    if (!currentAd) {
        return null;
    }

    return (
        <div className="popup-ad-overlay" onClick={onClose}>
            <div className="popup-ad-container" onClick={(e) => e.stopPropagation()}>
                <button 
                    className="popup-ad-close"
                    onClick={() => handleDismiss(currentAd._id)}
                    aria-label="Close ad"
                >
                    ✕
                </button>

                <div 
                    className="popup-ad-content"
                    onClick={() => handleAdClick(currentAd)}
                    style={{ cursor: currentAd.link ? 'pointer' : 'default' }}
                >
                    {currentAd.image && (
                        <div className="popup-ad-image">
                            {currentAd.imageUrl ? (
                                <img src={currentAd.imageUrl} alt={currentAd.title} />
                            ) : (
                                <div className="popup-ad-emoji">{currentAd.image}</div>
                            )}
                        </div>
                    )}

                    <div className="popup-ad-body">
                        <h3 className="popup-ad-title">{currentAd.title}</h3>
                        <p className="popup-ad-content-text">{currentAd.content}</p>
                        
                        {currentAd.link && (
                            <div className="popup-ad-cta">
                                <span>{currentAd.cta || 'Learn More'}</span>
                                <span style={{ marginLeft: '8px' }}>↗</span>
                            </div>
                        )}
                    </div>
                </div>

                {ads.length > 1 && (
                    <div className="popup-ad-indicators">
                        {ads.map((_, index) => (
                            <span
                                key={index}
                                className={`popup-ad-dot ${index === currentAdIndex ? 'active' : ''}`}
                                onClick={() => setCurrentAdIndex(index)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .popup-ad-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-in;
                }

                .popup-ad-container {
                    position: relative;
                    background: var(--wifi-mtaani-panel, #1a2b3d);
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    border: 2px solid var(--wifi-mtaani-accent, #2feff5);
                    animation: slideUp 0.3s ease-out;
                }

                .popup-ad-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.5);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    z-index: 10;
                    transition: background 0.2s;
                }

                .popup-ad-close:hover {
                    background: rgba(0, 0, 0, 0.7);
                }

                .popup-ad-content {
                    padding: 24px;
                    color: white;
                }

                .popup-ad-image {
                    width: 100%;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(47, 231, 245, 0.1);
                    border-radius: 12px;
                    margin-bottom: 16px;
                    overflow: hidden;
                }

                .popup-ad-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .popup-ad-emoji {
                    font-size: 64px;
                }

                .popup-ad-body {
                    text-align: center;
                }

                .popup-ad-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: var(--wifi-mtaani-accent, #2feff5);
                }

                .popup-ad-content-text {
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0 0 20px 0;
                    color: rgba(255, 255, 255, 0.9);
                }

                .popup-ad-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    background: var(--wifi-mtaani-accent, #2feff5);
                    color: #081425;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .popup-ad-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(47, 231, 245, 0.4);
                }

                .popup-ad-indicators {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.2);
                }

                .popup-ad-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }

                .popup-ad-dot.active {
                    background: var(--wifi-mtaani-accent, #2feff5);
                    transform: scale(1.2);
                }

                .popup-ad-dot:hover {
                    background: rgba(255, 255, 255, 0.5);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @media (max-width: 640px) {
                    .popup-ad-container {
                        width: 95%;
                        max-height: 85vh;
                    }

                    .popup-ad-title {
                        font-size: 20px;
                    }

                    .popup-ad-content-text {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
}
