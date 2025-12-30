/**
 * Free Trial Banner Component
 * Displays free trial promotion on the main page
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function FreeTrialBanner({
    onClaimTrial,
    showClaimButton = true
}) {
    const [dismissed, setDismissed] = useState(false);

    // Add safety check for client-side rendering
    if (typeof window === 'undefined') {
        return null;
    }

    let user, isAuthenticated;
    try {
        const authContext = useAuth();
        user = authContext.user;
        isAuthenticated = authContext.isAuthenticated;
    } catch (error) {
        // If useAuth fails, assume not authenticated
        user = null;
        isAuthenticated = false;
    }

    // Don't show if user has already used free trial or is not authenticated
    if (!isAuthenticated || user?.freeTrialUsed || dismissed) {
        return null;
    }

    return (
        <div className="card" style={{
            background: 'linear-gradient(135deg, #f0fdfa, #ecfccb)',
            border: '1px solid #a7f3d0',
            marginBottom: 24,
            position: 'relative'
        }}>
            <button
                onClick={() => setDismissed(true)}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    color: '#6b7280',
                    cursor: 'pointer',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
                ×
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>🎁</div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--brand-2)', marginBottom: 4, fontSize: 18 }}>
                        Claim Your Free Trial!
                    </h3>
                    <p className="kv" style={{ marginBottom: 0, fontSize: 14 }}>
                        Get 1 day of free internet access. No payment required!
                    </p>
                </div>
                {showClaimButton && (
                    <div>
                        <Link href="/account/free-trial" className="btn" style={{ padding: '8px 16px' }}>
                            Claim Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
