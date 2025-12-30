import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { validateForm, validationRules, normalizePhone } from '../../lib/validation';
import { getPortalData } from '../../lib/portalData';

export default function Login() {
    const router = useRouter();
    const { login, loading } = useAuth();
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [portalData, setPortalData] = useState(null);

    useEffect(() => {
        // Get portal data if available
        const data = getPortalData();
        if (data) {
            setPortalData(data);
        }

        // Check if there's a redirect URL
        const next = router.query.next;
        if (next) {
            // Store the redirect URL for after login
            sessionStorage.setItem('eco.redirectAfterLogin', next);
        }
    }, [router.query.next]);

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
        setFormLoading(true);
        setErrors({});

        // Validate form (no password validation for login)
        const validation = validateForm(formData, {
            phone: validationRules.phone
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            setFormLoading(false);
            return;
        }

        try {
            // Normalize phone number
            const normalizedPhone = normalizePhone(formData.phone);

            // Prepare login data
            const loginData = {
                phone: normalizedPhone,
                password: formData.password
            };

            // Call login
            const result = await login(loginData);

            if (result.success) {
                // Redirect to intended page or account dashboard
                const redirectUrl = sessionStorage.getItem('eco.redirectAfterLogin') || '/account';
                sessionStorage.removeItem('eco.redirectAfterLogin');
                router.push(redirectUrl);
            } else if (!result.success && result.error) {
                // Show contextual field errors
                if (result.error.toLowerCase().includes('phone')) {
                    setErrors(prev => ({ ...prev, phone: result.error }));
                } else if (result.error.toLowerCase().includes('password')) {
                    setErrors(prev => ({ ...prev, password: result.error }));
                } else {
                    setErrors(prev => ({ ...prev, general: result.error }));
                }
            }

        } catch (err) {
            console.error('Login error:', err);
            // Set form-level error if no specific field errors
            if (!Object.keys(errors).length) {
                setErrors({ general: err.message || 'Login failed' });
            }
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ width: '100%', maxWidth: 480, background: 'var(--ivynex-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ color: 'var(--ivynex-accent)', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
                        Welcome to Ivynex Wi-Fi
                    </h1>
                    <p style={{ color: 'var(--ivynex-accent)', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                        Tap.Pay.Connect.
                    </p>
                    <p className="kv" style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>
                        Sign in to manage your subscriptions
                    </p>
                </div>

                {portalData && (
                    <div style={{ marginBottom: 20, padding: 16, background: 'rgba(33, 175, 233, 0.1)', borderRadius: 12, border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                        <div style={{ color: 'var(--ivynex-accent)', fontSize: 14 }}>
                            <strong>Device detected:</strong> {portalData.mac}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 4 }}>
                            Your device will be automatically linked after login
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {errors.general && (
                        <div style={{ marginBottom: 20, padding: 12, background: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            <div style={{ color: '#fca5a5', fontSize: 14 }}>{errors.general}</div>
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 1XXXXXXXX, 254XXXXXXXXX, or +254XXXXXXXXX"
                            disabled={formLoading}
                        />
                        {errors.phone && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Enter your password"
                            disabled={formLoading}
                        />
                        {errors.password && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={formLoading}
                        style={{ width: '100%', marginBottom: 16 }}
                    >
                        {formLoading ? 'Connecting...' : 'Connect to Internet'}
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <span className="kv">Don't have an account? </span>
                        <Link href="/auth/register" className="btn ghost" style={{ padding: '8px 12px' }}>
                            Create Account
                        </Link>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/" className="btn ghost" style={{ padding: '8px 12px' }}>
                            ← Back to Home
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
