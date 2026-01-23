import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { validateForm, validationRules, normalizePhone } from '../../lib/validation';
import { getPortalData } from '../../lib/portalData';

export default function Register() {
    const router = useRouter();
    const { register, loading } = useAuth();
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        referralCode: ''
    });
    const [errors, setErrors] = useState({});
    const [portalData, setPortalData] = useState(null);

    useEffect(() => {
        // Get portal data if available
        const data = getPortalData();
        if (data) {
            setPortalData(data);
        }
    }, []);

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

        // Validate form
        const validation = validateForm(formData, {
            name: validationRules.name,
            phone: validationRules.phone,
            email: validationRules.email,
            password: validationRules.password,
            confirmPassword: validationRules.confirmPassword
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            setFormLoading(false);
            return;
        }

        try {
            // Normalize phone number
            const normalizedPhone = normalizePhone(formData.phone);

            // Prepare registration data
            const registrationData = {
                name: formData.name.trim(),
                phone: normalizedPhone,
                email: formData.email.trim() || undefined,
                password: formData.password,
                mac: portalData?.mac || null,
                referralCode: formData.referralCode?.trim() || undefined
            };

            // Call registration
            const result = await register(registrationData);

            if (result.success) {
                // Redirect to intended destination or account dashboard
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect') || '/account';
                router.push(redirectPath);
            } else {
                // Display specific error from backend
                setErrors({ general: result.error || 'Registration failed' });
            }

        } catch (err) {
            console.error('Registration error:', err);
            // Set form-level error if no specific field errors
            if (!Object.keys(errors).length) {
                setErrors({ general: err.message || 'Registration failed' });
            }
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ width: '100%', maxWidth: 480, background: 'var(--wifi-mtaani-panel)', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
                        Welcome to Wifi Mtaani Hotspot
                    </h1>
                    <p style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                        Tap.Pay.Connect.
                    </p>
                    <p className="kv" style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }}>
                        Create an account to get faster access and track your subscriptions
                    </p>
                </div>

                {portalData && (
                    <div style={{ marginBottom: 20, padding: 16, background: 'rgba(33, 175, 233, 0.1)', borderRadius: 12, border: '1px solid rgba(47, 231, 245, 0.3)' }}>
                        <div style={{ color: 'var(--wifi-mtaani-accent)', fontSize: 14 }}>
                            <strong>Device detected:</strong> {portalData.mac}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 4 }}>
                            Your device will be automatically linked after registration
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
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Enter your full name"
                            disabled={formLoading}
                        />
                        {errors.name && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
                    </div>

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

                    <div style={{ marginBottom: 20 }}>
                        <label htmlFor="email">Email (Optional)</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="your@email.com"
                            disabled={formLoading}
                        />
                        {errors.email && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label htmlFor="referralCode">Referral Code (Optional)</label>
                        <input
                            type="text"
                            id="referralCode"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Enter referral code if you have one"
                            disabled={formLoading}
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="Create a strong password"
                            disabled={formLoading}
                        />
                        {errors.password && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
                        <div className="kv" style={{ fontSize: 12, marginTop: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                            Minimum 8 characters with at least one letter and one number
                        </div>
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
                            placeholder="Confirm your password"
                            disabled={formLoading}
                        />
                        {errors.confirmPassword && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}
                    </div>

                    <div style={{ marginBottom: 20, padding: 16, background: 'rgba(245, 158, 11, 0.2)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                        <div style={{ color: '#fbbf24', fontSize: 12 }}>
                            <strong>Important:</strong> Password recovery is by Email only. If you don't provide an email, you'll need to contact support to recover your account.
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={formLoading}
                        style={{ width: '100%', marginBottom: 16 }}
                    >
                        {formLoading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <span className="kv">Already have an account? </span>
                        <Link href="/auth/login" className="btn ghost" style={{ padding: '8px 12px' }}>
                            Sign In
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
