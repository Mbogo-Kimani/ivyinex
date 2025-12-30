import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { validateForm, validationRules, normalizePhone } from '../../lib/validation';
import * as api from '../../lib/api';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});

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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validate form
        const validation = validateForm(formData, {
            name: validationRules.name,
            phone: validationRules.phone,
            email: validationRules.email
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            setLoading(false);
            return;
        }

        try {
            // Normalize phone number
            const normalizedPhone = normalizePhone(formData.phone);

            // Prepare update data
            const updateData = {
                name: formData.name.trim(),
                phone: normalizedPhone,
                email: formData.email.trim() || undefined
            };

            // Call profile update API
            const response = await api.updateProfile(updateData);

            if (response.ok && response.user) {
                updateUser(response.user);
                showSuccess('Profile updated successfully!');
            } else {
                throw new Error(response.error || 'Profile update failed');
            }

        } catch (err) {
            showError(err.message || 'Profile update failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPasswordErrors({});

        // Validate form
        const validation = validateForm(passwordData, {
            currentPassword: (value) => {
                if (!value) return { isValid: false, message: 'Current password is required' };
                return { isValid: true, message: '' };
            },
            newPassword: validationRules.password,
            confirmPassword: validationRules.confirmPassword
        });

        if (!validation.isValid) {
            setPasswordErrors(validation.errors);
            setLoading(false);
            return;
        }

        try {
            // Call password change API
            const response = await api.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.ok) {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                showSuccess('Password changed successfully!');
            } else {
                throw new Error(response.error || 'Password change failed');
            }

        } catch (err) {
            showError(err.message || 'Password change failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div style={{ minHeight: '100vh', padding: 20 }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <Link href="/account" className="btn ghost" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ← Back to Account
                        </Link>
                        <h1 style={{ color: 'var(--brand-2)', fontSize: 32, marginBottom: 8 }}>
                            Profile Settings
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage your personal information and account security
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb' }}>
                            <button
                                className={`btn ${activeTab === 'profile' ? '' : 'ghost'}`}
                                onClick={() => setActiveTab('profile')}
                                style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--brand-1)' : '2px solid transparent' }}
                            >
                                Personal Information
                            </button>
                            <button
                                className={`btn ${activeTab === 'password' ? '' : 'ghost'}`}
                                onClick={() => setActiveTab('password')}
                                style={{ borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === 'password' ? '2px solid var(--brand-1)' : '2px solid transparent' }}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* Profile Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="card" style={{ maxWidth: 600 }}>
                            <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Personal Information</h2>

                            <form onSubmit={handleProfileSubmit}>
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
                                    <button
                                        type="button"
                                        className="btn ghost"
                                        onClick={() => {
                                            setFormData({
                                                name: user?.name || '',
                                                phone: user?.phone || '',
                                                email: user?.email || ''
                                            });
                                            setErrors({});
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Change Password Tab */}
                    {activeTab === 'password' && (
                        <div className="card" style={{ maxWidth: 600 }}>
                            <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Change Password</h2>

                            <form onSubmit={handlePasswordSubmit}>
                                <div style={{ marginBottom: 20 }}>
                                    <label htmlFor="currentPassword">Current Password *</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="input"
                                        placeholder="Enter your current password"
                                        disabled={loading}
                                    />
                                    {passwordErrors.currentPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{passwordErrors.currentPassword}</div>}
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label htmlFor="newPassword">New Password *</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="input"
                                        placeholder="Enter your new password"
                                        disabled={loading}
                                    />
                                    {passwordErrors.newPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{passwordErrors.newPassword}</div>}
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
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="input"
                                        placeholder="Confirm your new password"
                                        disabled={loading}
                                    />
                                    {passwordErrors.confirmPassword && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{passwordErrors.confirmPassword}</div>}
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
                                    <button
                                        type="button"
                                        className="btn ghost"
                                        onClick={() => {
                                            setPasswordData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            });
                                            setPasswordErrors({});
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Account Information */}
                    <div className="card" style={{ maxWidth: 600, marginTop: 32 }}>
                        <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Account Information</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span className="kv">Account ID</span>
                                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--brand-2)' }}>
                                    {user?._id || 'Loading...'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span className="kv">Member Since</span>
                                <span>
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Loading...'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                                <span className="kv">Account Status</span>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
