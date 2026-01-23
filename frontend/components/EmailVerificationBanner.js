import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function EmailVerificationBanner() {
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const [sending, setSending] = useState(false);
    const [visible, setVisible] = useState(true);

    if (!isAuthenticated || !user || !user.email || user.emailVerified) {
        return null;
    }

    if (!visible) return null;

    const handleResend = async () => {
        setSending(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ivyinex.onrender.com';
            const response = await fetch(`${BACKEND_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('eco.authToken')}`
                },
                body: JSON.stringify({ email: user.email })
            });
            const data = await response.json();
            if (response.ok) {
                showSuccess('Verification email sent!');
                setVisible(false);
            } else {
                showError(data.error || 'Failed to send email');
            }
        } catch (error) {
            showError('Network error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 1000,
            background: '#fff3cd',
            color: '#856404',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #ffeeba',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <div style={{ flex: 1, marginRight: 16 }}>
                <strong>Verify your email!</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                    Please verify your email address ({user.email}) to secure your account.
                </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={handleResend}
                    disabled={sending}
                    style={{
                        background: '#856404',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}
                >
                    {sending ? 'Sending...' : 'Resend Email'}
                </button>
                <button
                    onClick={() => setVisible(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#856404',
                        cursor: 'pointer',
                        fontSize: '18px',
                        opacity: 0.6
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
