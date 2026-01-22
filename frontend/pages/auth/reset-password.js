import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { resetPassword } from '../../lib/api';

export default function ResetPassword() {
    const router = useRouter();
    const { token } = router.query;
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        // Validation
        if (!formData.newPassword) {
            setErrors({ newPassword: 'Password is required' });
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setErrors({ newPassword: 'Password must be at least 6 characters' });
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            setLoading(false);
            return;
        }

        if (!token) {
            setErrors({ general: 'Invalid reset token' });
            setTokenValid(false);
            setLoading(false);
            return;
        }

        try {
            const result = await resetPassword(token, formData.newPassword);

            if (result.ok) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
            } else {
                setErrors({ general: result.error || 'Failed to reset password' });
                if (result.error?.includes('expired') || result.error?.includes('Invalid')) {
                    setTokenValid(false);
                }
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setErrors({ general: err.message || 'An error occurred. Please try again.' });
            if (err.message?.includes('expired') || err.message?.includes('Invalid')) {
                setTokenValid(false);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
                <div style={{ width: '100%', maxWidth: 480, background: 'var(--wifi-mtaani-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 24, padding: 20, background: 'rgba(239, 68, 68, 0.2)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            <div style={{ color: '#fca5a5', fontSize: 18, marginBottom: 8, fontWeight: 600 }}>
                                Invalid or Expired Token
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, lineHeight: 1.6 }}>
                                This password reset link is invalid or has expired. Please request a new password reset.
                            </div>
                        </div>
                        <Link href="/auth/forgot-password" className="btn" style={{ width: '100%', marginBottom: 16 }}>
                            Request New Reset Link
                        </Link>
                        <Link href="/auth/login" className="btn ghost" style={{ width: '100%' }}>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ width: '100%', maxWidth: 480, background: 'var(--wifi-mtaani-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
                        Reset Password
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
                        Enter your new password below
                    </p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 24, padding: 20, background: 'rgba(34, 197, 94, 0.2)', borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                            <div style={{ color: '#86efac', fontSize: 18, marginBottom: 8, fontWeight: 600 }}>
                                ✓ Password Reset Successful
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, lineHeight: 1.6 }}>
                                Your password has been reset successfully. Redirecting to login...
                            </div>
                        </div>
                        <Link href="/auth/login" className="btn" style={{ width: '100%' }}>
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {errors.general && (
                            <div style={{ marginBottom: 20, padding: 12, background: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                                <div style={{ color: '#fca5a5', fontSize: 14 }}>{errors.general}</div>
                            </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                            <label htmlFor="newPassword">New Password *</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="Enter new password (min 6 characters)"
                                disabled={loading}
                            />
                            {errors.newPassword && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.newPassword}</div>}
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="Confirm new password"
                                disabled={loading}
                            />
                            {errors.confirmPassword && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                            style={{ width: '100%', marginBottom: 16 }}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <Link href="/auth/login" className="btn ghost" style={{ padding: '8px 12px' }}>
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}




