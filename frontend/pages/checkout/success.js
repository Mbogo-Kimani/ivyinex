import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import AuthModal from '../../components/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function CheckoutSuccess() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [linking, setLinking] = useState(false);
    const [linked, setLinked] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, pending, success, failed
    const [statusMessage, setStatusMessage] = useState('Checking payment status...');

    useEffect(() => {
        // Try getting paymentId from URL or localStorage
        if (router.isReady) {
            const urlPaymentId = router.query.paymentId;
            const storagePaymentId = localStorage.getItem('pendingPaymentId');

            const pid = urlPaymentId || storagePaymentId;
            if (pid) {
                setPaymentId(pid);
            } else {
                setStatus('failed');
                setStatusMessage('No payment ID found. Please start a new purchase.');
            }
        }
    }, [router.isReady, router.query]);

    useEffect(() => {
        if (!paymentId) return;

        let interval;
        const checkStatus = async () => {
            try {
                // If checking manually while not logged in, we assume the API allows public status check by ID
                const res = await fetch(`/api/checkout/status/${paymentId}`);

                if (res.ok) {
                    const data = await res.json();

                    if (data.status === 'success') {
                        setStatus('success');
                        setStatusMessage('Payment successful!');
                        clearInterval(interval);

                        // Trigger linking if authenticated
                        if (isAuthenticated && !linked && !linking) {
                            linkPayment(paymentId);
                        }
                    } else if (data.status === 'failed') {
                        setStatus('failed');
                        setStatusMessage(data.errorMessage || data.ResultDesc || 'Payment failed');
                        clearInterval(interval);
                    } else {
                        // Pending
                        setStatus('pending');
                        setStatusMessage('Waiting for payment confirmation...');
                    }
                }
            } catch (err) {
                console.error('Status check error:', err);
            }
        };

        // Check immediately
        checkStatus();

        // Poll every 3 seconds
        interval = setInterval(checkStatus, 3000);

        // Stop polling after 3 minutes (180s)
        const timeout = setTimeout(() => {
            clearInterval(interval);
            if (status !== 'success' && status !== 'failed') {
                setStatus('timeout');
                setStatusMessage('Payment status check timed out. Please check your SMS for confirmation.');
            }
        }, 180000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [paymentId, isAuthenticated, linked, linking]);

    // Re-trigger link if user logs in after success is confirmed
    useEffect(() => {
        if (isAuthenticated && status === 'success' && !linked && !linking && paymentId) {
            linkPayment(paymentId);
        }
    }, [isAuthenticated, status, linked, linking, paymentId]);


    const linkPayment = async (pid) => {
        setLinking(true);
        try {
            const authToken = localStorage.getItem('eco.authToken') || localStorage.getItem('token');
            const res = await fetch('/api/checkout/link-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ paymentId: pid })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.ok) {
                    setLinked(true);
                    showSuccess('Payment linked to your account!');
                    localStorage.removeItem('pendingPaymentId');
                    setTimeout(() => {
                        router.push('/account');
                    }, 2000);
                } else {
                    if (data.message === 'Already linked to you') {
                        setLinked(true);
                        localStorage.removeItem('pendingPaymentId');
                        setTimeout(() => {
                            router.push('/account');
                        }, 1500);
                    } else {
                        // Don't error loud, just log
                        console.error('Link failed:', data);
                    }
                }
            }
        } catch (err) {
            console.error('Link error:', err);
        } finally {
            setLinking(false);
        }
    };

    const handleAuthSuccess = () => {
        setAuthModalOpen(false);
    };

    return (
        <>
            <Header />
            <div className="container center" style={{ minHeight: '80vh', textAlign: 'center' }}>
                <div style={{ maxWidth: 500, width: '100%' }}>

                    {status === 'pending' || status === 'loading' ? (
                        <div className="fade-in">
                            <div className="spinner-large" style={{ margin: '0 auto 20px', borderTopColor: 'var(--brand-3)' }}></div>
                            <h2>{statusMessage}</h2>
                            <p style={{ marginTop: 15, color: 'var(--wifi-mtaani-muted)' }}>
                                Please enter your M-Pesa PIN on your phone.
                            </p>
                        </div>
                    ) : status === 'failed' || status === 'timeout' ? (
                        <div className="fade-in">
                            <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
                            <h1>Payment Failed</h1>
                            <p style={{ color: '#ff6b6b', margin: '20px 0', fontSize: 18 }}>{statusMessage}</p>
                            <div style={{ marginTop: 30 }}>
                                <Link href="/" className="btn">Try Again</Link>
                            </div>
                        </div>
                    ) : (
                        // SUCCESS
                        <div className="fade-in">
                            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                            <h1>Payment Successful!</h1>
                            <p style={{ fontSize: 18, margin: '20px 0', color: 'var(--wifi-mtaani-muted)' }}>
                                Thank you for your purchase. You are now connected.
                            </p>

                            {linked ? (
                                <div style={{ marginTop: 30 }} className="fade-in">
                                    <div style={{ padding: 15, background: 'rgba(52, 211, 153, 0.1)', borderRadius: 8, marginBottom: 20, border: '1px solid #34d399' }}>
                                        <h3 style={{ margin: 0, color: '#34d399' }}>✅ Package Linked</h3>
                                        <p style={{ fontSize: 14, margin: '5px 0 0 0' }}>Your subscription is safe in your account.</p>
                                    </div>
                                    <Link href="/account" className="btn full-width">
                                        Go to Dashboard
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ marginTop: 30 }}>
                                    {isAuthenticated ? (
                                        <div>
                                            {linking ? (
                                                <p>Linking payment to your account...</p>
                                            ) : (
                                                <button onClick={() => paymentId && linkPayment(paymentId)} className="btn full-width">
                                                    Complete Setup
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="card" style={{ padding: 24, border: '1px solid var(--brand-2)' }}>
                                            <h3>Almost Done!</h3>
                                            <p style={{ marginBottom: 20, lineHeight: 1.5, color: '#e5e7eb' }}>
                                                Create an account (or sign in) to save this package. This allows you to transfer it to other devices.
                                            </p>
                                            <button onClick={() => setAuthModalOpen(true)} className="btn full-width">
                                                Create Account / Sign In
                                            </button>
                                            <div style={{ marginTop: 15 }}>
                                                <Link href="/ads" className="kv btn-link" style={{ fontSize: 14 }}>
                                                    Skip & Browse as Guest
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                title="Save Your Package"
                message="Sign in to link this payment to your account."
                redirectPath="/checkout/success"
            />
        </>
    );
}
