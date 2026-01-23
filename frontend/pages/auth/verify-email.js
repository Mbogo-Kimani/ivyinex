import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { verifyEmail } from '../../lib/api';

export default function VerifyEmail() {
    const router = useRouter();
    const { token } = router.query;
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!router.isReady || !token) {
            if (router.isReady && !token) {
                setStatus('error');
                setMessage('Invalid verification link. Token is missing.');
            }
            return;
        }

        // Prevent double verification if already succeeded/failed
        if (status !== 'verifying') return;

        const verify = async () => {
            try {
                const result = await verifyEmail(token);
                if (result.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    // Redirect to login or account after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Failed to verify email.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.message || 'An error occurred during verification.');
            }
        };

        verify();
    }, [router.isReady, token]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: 480,
                background: 'var(--wifi-mtaani-panel)',
                padding: 32,
                borderRadius: 16,
                boxShadow: 'var(--shadow)',
                border: '1px solid rgba(47, 231, 245, 0.3)',
                textAlign: 'center'
            }}>
                <h1 style={{ color: 'white', marginBottom: 24, fontSize: 24 }}>Email Verification</h1>

                {status === 'verifying' && (
                    <div className="kv" style={{ fontSize: 18 }}>
                        ⏳ {message}
                    </div>
                )}

                {status === 'success' && (
                    <div style={{
                        padding: 20,
                        background: 'rgba(34, 197, 94, 0.2)',
                        borderRadius: 12,
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        marginBottom: 24
                    }}>
                        <div style={{ color: '#86efac', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                            ✓ Success!
                        </div>
                        <p style={{ color: 'white' }}>{message}</p>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Redirecting you to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{
                        padding: 20,
                        background: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: 12,
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        marginBottom: 24
                    }}>
                        <div style={{ color: '#fca5a5', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                            ⚠ Verification Failed
                        </div>
                        <p style={{ color: 'white' }}>{message}</p>
                    </div>
                )}

                <div style={{ marginTop: 24 }}>
                    <Link href="/auth/login" className="btn" style={{ width: '100%', textDecoration: 'none' }}>
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
