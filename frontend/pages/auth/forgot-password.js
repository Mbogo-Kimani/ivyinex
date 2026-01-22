import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { forgotPassword } from '../../lib/api';

export default function ForgotPassword() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        phone: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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

        // Validate that at least one field is provided
        if (!formData.email && !formData.phone) {
            setErrors({ general: 'Please provide either email or phone number' });
            setLoading(false);
            return;
        }

        try {
            // Prepare request payload
            const payload = {};
            if (formData.email) payload.email = formData.email.trim();
            if (formData.phone) payload.phone = formData.phone.trim();

            const result = await forgotPassword(payload);

            if (result.ok) {
                setSuccess(true);
            } else {
                setErrors({ general: result.error || 'Failed to send password reset email' });
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setErrors({ general: err.message || 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ width: '100%', maxWidth: 480, background: 'var(--wifi-mtaani-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
                        Forgot Password?
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
                        Enter your email or phone number to receive a password reset link
                    </p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: 24, padding: 20, background: 'rgba(34, 197, 94, 0.2)', borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                            <div style={{ color: '#86efac', fontSize: 16, marginBottom: 8 }}>
                                ✓ Check your email
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, lineHeight: 1.6 }}>
                                If an account with that email/phone exists, a password reset link has been sent. Please check your email inbox and follow the instructions.
                            </div>
                        </div>
                        <Link href="/auth/login" className="btn" style={{ width: '100%', marginBottom: 16 }}>
                            Back to Login
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
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="your.email@example.com"
                                disabled={loading}
                            />
                            {errors.email && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: 20, color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                            OR
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="07XXXXXXXX or 254XXXXXXXXX"
                                disabled={loading}
                            />
                            {errors.phone && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                            style={{ width: '100%', marginBottom: 16 }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
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




