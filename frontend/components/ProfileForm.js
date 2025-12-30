/**
 * Profile Form Component
 * Reusable form for editing user profile information
 */

import { useState, useEffect } from 'react';
import { validateForm, validationRules, normalizePhone } from '../../lib/validation';

export default function ProfileForm({
    user,
    onSubmit,
    loading = false,
    showCancel = true,
    onCancel
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
    }, [user]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        // Validate form
        const validation = validateForm(formData, {
            name: validationRules.name,
            phone: validationRules.phone,
            email: validationRules.email
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(formData.phone);

        // Prepare update data
        const updateData = {
            name: formData.name.trim(),
            phone: normalizedPhone,
            email: formData.email.trim() || undefined
        };

        onSubmit(updateData);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
        setErrors({});
        if (onCancel) onCancel();
    };

    return (
        <form onSubmit={handleSubmit}>
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
                    disabled={loading}
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
                    placeholder="07XXXXXXXX or +2547XXXXXXXX"
                    disabled={loading}
                />
                {errors.phone && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <div style={{ marginBottom: 24 }}>
                <label htmlFor="email">Email Address</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="your@email.com"
                    disabled={loading}
                />
                {errors.email && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
                <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                    Email is optional but recommended for account recovery
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    type="submit"
                    className="btn"
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
                {showCancel && (
                    <button
                        type="button"
                        className="btn ghost"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}






















