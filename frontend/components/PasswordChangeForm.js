/**
 * Password Change Form Component
 * Dedicated form for changing user password
 */

import { useState } from 'react';
import { validateForm, validationRules } from '../../lib/validation';

export default function PasswordChangeForm({
    onSubmit,
    loading = false,
    showCancel = true,
    onCancel
}) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

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
            currentPassword: (value) => {
                if (!value) return { isValid: false, message: 'Current password is required' };
                return { isValid: true, message: '' };
            },
            newPassword: validationRules.password,
            confirmPassword: (value) => {
                if (!value) return { isValid: false, message: 'Please confirm your new password' };
                if (value !== formData.newPassword) {
                    return { isValid: false, message: 'Passwords do not match' };
                }
                return { isValid: true, message: '' };
            }
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Prepare password change data
        const passwordData = {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
        };

        onSubmit(passwordData);
    };

    const handleCancel = () => {
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setErrors({});
        if (onCancel) onCancel();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
                <label htmlFor="currentPassword">Current Password *</label>
                <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter your current password"
                    disabled={loading}
                />
                {errors.currentPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.currentPassword}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
                <label htmlFor="newPassword">New Password *</label>
                <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter your new password"
                    disabled={loading}
                />
                {errors.newPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.newPassword}</div>}
                <div className="kv" style={{ fontSize: 12, marginTop: 4 }}>
                    Minimum 8 characters with at least one letter and one number
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label htmlFor="confirmPassword">Confirm New Password *</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Confirm your new password"
                    disabled={loading}
                />
                {errors.confirmPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
                <div className="kv" style={{ color: '#92400e', fontSize: 12 }}>
                    <strong>Important:</strong> Password recovery by SMS is currently disabled. Make sure to remember your new password.
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    type="submit"
                    className="btn"
                    disabled={loading}
                >
                    {loading ? 'Changing Password...' : 'Change Password'}
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






















