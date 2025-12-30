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
        confirmPassword: ''
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
                mac: portalData?.mac || null
            };

            // Call registration
            const result = await register(registrationData);

            if (result.success) {
                // Redirect to intended destination or account dashboard
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect') || '/account';
                router.push(redirectPath);
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 480, background: 'white', padding: 32, borderRadius: 16, boxShadow: 'var(--shadow)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ color: 'var(--brand-2)', fontSize: 28, marginBottom: 8 }}>
                        Create Account
                    </h1>
                    <p className="kv" style={{ fontSize: 16 }}>
                        Get faster access and track your subscriptions
                    </p>
                </div>

                {portalData && (
                    <div style={{ marginBottom: 20, padding: 16, background: '#f0fdfa', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                        <div className="kv" style={{ color: '#065f46', fontSize: 14 }}>
                            <strong>Device detected:</strong> {portalData.mac}
                        </div>
                        <div className="kv" style={{ color: '#065f46', fontSize: 12, marginTop: 4 }}>
                            Your device will be automatically linked after registration
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {errors.general && (
                        <div style={{ marginBottom: 20, padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5' }}>
                            <div style={{ color: '#dc2626', fontSize: 14 }}>{errors.general}</div>
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
                        {errors.name && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
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
                        {errors.phone && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
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
                        {errors.email && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
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
                        {errors.password && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
                        <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
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
                        {errors.confirmPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}
                    </div>

                    <div style={{ marginBottom: 20, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
                        <div className="kv" style={{ color: '#92400e', fontSize: 12 }}>
                            <strong>Important:</strong> Password recovery by SMS is currently disabled. Keep your password safe.
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
