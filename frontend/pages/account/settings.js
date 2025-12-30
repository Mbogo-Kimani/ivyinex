import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AccountSettings() {
    const { user, logout } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        showSuccess('Logged out successfully');
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            // TODO: Call delete account API
            console.log('Delete account for user:', user?._id);

            // For now, simulate success
            showWarning('Account deletion is not yet implemented. Please contact support.');
            setShowDeleteConfirm(false);

        } catch (err) {
            showError(err.message || 'Failed to delete account');
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
                            Account Settings
                        </h1>
                        <p className="kv" style={{ fontSize: 16 }}>
                            Manage your account preferences and security settings
                        </p>
                    </div>

                    {/* Security Settings */}
                    <div className="card" style={{ maxWidth: 600, marginBottom: 32 }}>
                        <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Security</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Password</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Last changed: Never</div>
                                </div>
                                <Link href="/account/profile" className="btn ghost" style={{ padding: '8px 16px' }}>
                                    Change
                                </Link>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Two-Factor Authentication</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Not available yet</div>
                                </div>
                                <button className="btn ghost" disabled style={{ padding: '8px 16px' }}>
                                    Enable
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Login Sessions</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Manage active sessions</div>
                                </div>
                                <button className="btn ghost" disabled style={{ padding: '8px 16px' }}>
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="card" style={{ maxWidth: 600, marginBottom: 32 }}>
                        <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Privacy</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Data Usage</div>
                                    <div className="kv" style={{ fontSize: 14 }}>How we use your data</div>
                                </div>
                                <button className="btn ghost" disabled style={{ padding: '8px 16px' }}>
                                    View
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Marketing Communications</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Email notifications and updates</div>
                                </div>
                                <button className="btn ghost" disabled style={{ padding: '8px 16px' }}>
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="card" style={{ maxWidth: 600, marginBottom: 32 }}>
                        <h2 style={{ color: 'var(--brand-2)', marginBottom: 20 }}>Account Actions</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Export Data</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Download your account data</div>
                                </div>
                                <button className="btn ghost" disabled style={{ padding: '8px 16px' }}>
                                    Export
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand-2)', marginBottom: 4 }}>Sign Out</div>
                                    <div className="kv" style={{ fontSize: 14 }}>Sign out of all devices</div>
                                </div>
                                <button
                                    className="btn ghost"
                                    onClick={handleLogout}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card" style={{ maxWidth: 600, border: '1px solid #fecaca', background: '#fef2f2' }}>
                        <h2 style={{ color: '#dc2626', marginBottom: 20 }}>Danger Zone</h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Delete Account</div>
                                    <div className="kv" style={{ fontSize: 14, color: '#991b1b' }}>
                                        Permanently delete your account and all data. This action cannot be undone.
                                    </div>
                                </div>
                                <button
                                    className="btn"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="modal-backdrop" style={{ zIndex: 1000 }}>
                            <div className="modal" style={{ maxWidth: 500 }}>
                                <h3 style={{ color: '#dc2626', marginBottom: 16 }}>Delete Account</h3>

                                <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
                                    Are you sure you want to delete your account? This action will:
                                </p>

                                <ul style={{ marginBottom: 20, paddingLeft: 20, lineHeight: 1.6 }}>
                                    <li>Permanently delete your profile and personal information</li>
                                    <li>Cancel all active subscriptions</li>
                                    <li>Remove all linked devices</li>
                                    <li>Delete your account history</li>
                                </ul>

                                <p style={{ marginBottom: 24, fontWeight: 600, color: '#dc2626' }}>
                                    This action cannot be undone.
                                </p>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        className="btn"
                                        onClick={handleDeleteAccount}
                                        disabled={loading}
                                        style={{
                                            background: '#dc2626',
                                            color: 'white',
                                            border: 'none'
                                        }}
                                    >
                                        {loading ? 'Deleting...' : 'Yes, Delete Account'}
                                    </button>
                                    <button
                                        className="btn ghost"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}






















