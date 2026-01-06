// Settings page for Eco Wifi Management System
import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    User,
    Lock,
    Bell,
    Globe,
    Database,
    Server,
    Mail,
    Shield,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Plus,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiMethods } from '../services/api';
import { useData } from '../hooks/useApi.jsx';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [showAddAdminForm, setShowAddAdminForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({});
    const [settings, setSettings] = useState({
        general: {
            appName: 'Eco Wifi Management',
            timezone: 'Africa/Nairobi',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            language: 'en',
        },
        security: {
            sessionTimeout: 30,
            requireTwoFactor: false,
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireNumbers: true,
        },
        notifications: {
            emailNotifications: true,
            paymentNotifications: true,
            subscriptionNotifications: true,
            systemAlerts: true,
        },
        system: {
            autoBackup: true,
            backupFrequency: 'daily',
            logRetention: 30,
            cacheEnabled: true,
        }
    });

    const handleSave = async (section) => {
        setLoading(true);
        try {
            // In a real app, this would save to backend
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success(`${section} settings saved successfully`);
        } catch (error) {
            toast.error(`Failed to save ${section} settings`);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Fetch admins data only if authenticated
    const { data: adminsData, loading: adminsLoading, refetch: refetchAdmins } = useData(
        apiMethods.getAdmins,
        [],
        { enabled: isAuthenticated && activeTab === 'administrators' }
    );

    const handleAddAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newAdmin.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await apiMethods.createAdmin(newAdmin);
            toast.success('Admin created successfully');
            setNewAdmin({ name: '', email: '', password: '' });
            setShowAddAdminForm(false);
            refetchAdmins();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    // Delete admin functionality disabled - users must contact system administrator
    const handleDeleteAdmin = async (adminId) => {
        toast.error('Contact the system administrator to delete administrators', {
            duration: 5000,
            icon: '⚠️',
        });
    };

    const handleChangePassword = async (adminId) => {
        // Only allow changing own password
        if (adminId !== user?.id) {
            toast.error('You can only change your own password');
            return;
        }

        if (!passwordData.password || !passwordData.confirmPassword) {
            toast.error('Please fill in both password fields');
            return;
        }

        if (passwordData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (passwordData.password !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await apiMethods.changeAdminPassword(adminId, passwordData.password);
            toast.success('Password changed successfully');
            setPasswordData({ password: '', confirmPassword: '' });
            setShowPasswordForm(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'system', name: 'System', icon: Server },
        { id: 'administrators', name: 'Administrators', icon: User },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
            <div className="flex items-center">
                <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-sm text-gray-500">
                            Manage system settings and preferences
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center px-6 py-4 text-sm font-medium border-b-2
                                        ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5 mr-2" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Application Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.general.appName}
                                    onChange={(e) => handleInputChange('general', 'appName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timezone
                                </label>
                                <select
                                    value={settings.general.timezone}
                                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Format
                                    </label>
                                    <select
                                        value={settings.general.dateFormat}
                                        onChange={(e) => handleInputChange('general', 'dateFormat', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Format
                                    </label>
                                    <select
                                        value={settings.general.timeFormat}
                                        onChange={(e) => handleInputChange('general', 'timeFormat', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="24h">24 Hour</option>
                                        <option value="12h">12 Hour</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Language
                                </label>
                                <select
                                    value={settings.general.language}
                                    onChange={(e) => handleInputChange('general', 'language', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="en">English</option>
                                    <option value="sw">Swahili</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleSave('general')}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save General Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session Timeout (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="480"
                                    value={settings.security.sessionTimeout}
                                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Require Two-Factor Authentication
                                    </label>
                                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.security.requireTwoFactor}
                                    onChange={(e) => handleInputChange('security', 'requireTwoFactor', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Password Length
                                </label>
                                <input
                                    type="number"
                                    min="6"
                                    max="32"
                                    value={settings.security.passwordMinLength}
                                    onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Require Uppercase Letters
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.passwordRequireUppercase}
                                        onChange={(e) => handleInputChange('security', 'passwordRequireUppercase', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Require Numbers
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.passwordRequireNumbers}
                                        onChange={(e) => handleInputChange('security', 'passwordRequireNumbers', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleSave('security')}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Security Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email Notifications
                                    </label>
                                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.emailNotifications}
                                    onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Payment Notifications
                                    </label>
                                    <p className="text-sm text-gray-500">Get notified about new payments</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.paymentNotifications}
                                    onChange={(e) => handleInputChange('notifications', 'paymentNotifications', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Subscription Notifications
                                    </label>
                                    <p className="text-sm text-gray-500">Get notified about subscription changes</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.subscriptionNotifications}
                                    onChange={(e) => handleInputChange('notifications', 'subscriptionNotifications', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        System Alerts
                                    </label>
                                    <p className="text-sm text-gray-500">Get notified about system issues</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.systemAlerts}
                                    onChange={(e) => handleInputChange('notifications', 'systemAlerts', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleSave('notifications')}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Notification Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Automatic Backup
                                    </label>
                                    <p className="text-sm text-gray-500">Automatically backup system data</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.system.autoBackup}
                                    onChange={(e) => handleInputChange('system', 'autoBackup', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            {settings.system.autoBackup && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Backup Frequency
                                    </label>
                                    <select
                                        value={settings.system.backupFrequency}
                                        onChange={(e) => handleInputChange('system', 'backupFrequency', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Log Retention (days)
                                </label>
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={settings.system.logRetention}
                                    onChange={(e) => handleInputChange('system', 'logRetention', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Enable Cache
                                    </label>
                                    <p className="text-sm text-gray-500">Improve performance with caching</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.system.cacheEnabled}
                                    onChange={(e) => handleInputChange('system', 'cacheEnabled', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleSave('system')}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save System Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'administrators' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Administrators</h3>
                                    <p className="text-sm text-gray-500">Manage admin users and their access</p>
                                </div>
                                <button
                                    onClick={() => setShowAddAdminForm(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Admin
                                </button>
                            </div>

                            {/* Add Admin Form */}
                            {showAddAdminForm && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Administrator</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newAdmin.name}
                                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Admin name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newAdmin.email}
                                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="admin@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.new ? 'text' : 'password'}
                                                    value={newAdmin.password}
                                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                    placeholder="Password (min 6 characters)"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleAddAdmin}
                                                disabled={loading}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Create Admin
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAddAdminForm(false);
                                                    setNewAdmin({ name: '', email: '', password: '' });
                                                }}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admins List */}
                            {adminsLoading ? (
                                <div className="text-center py-8">
                                    <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                                    <p className="mt-2 text-sm text-gray-500">Loading admins...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {adminsData && adminsData.length > 0 ? (
                                        adminsData.map((admin) => (
                                            <div key={admin._id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center">
                                                            <User className="h-5 w-5 text-blue-600 mr-2" />
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-900">{admin.name || 'No name'}</h4>
                                                                <p className="text-sm text-gray-500">{admin.email}</p>
                                                            </div>
                                                            {admin._id === user?.id && (
                                                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        {showPasswordForm === admin._id ? (
                                                            <div className="flex items-center space-x-2">
                                                                <div className="flex flex-col space-y-2">
                                                                    <div className="relative">
                                                                        <input
                                                                            type={showPasswords[admin._id] ? 'text' : 'password'}
                                                                            value={passwordData.password}
                                                                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                                            placeholder="New password"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowPasswords({ ...showPasswords, [admin._id]: !showPasswords[admin._id] })}
                                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                                        >
                                                                            {showPasswords[admin._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <input
                                                                            type={showPasswords[admin._id] ? 'text' : 'password'}
                                                                            value={passwordData.confirmPassword}
                                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                                            placeholder="Confirm password"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowPasswords({ ...showPasswords, [admin._id]: !showPasswords[admin._id] })}
                                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                                        >
                                                                            {showPasswords[admin._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleChangePassword(admin._id)}
                                                                    disabled={loading}
                                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                                                >
                                                                    <Save className="w-3 h-3 mr-1" />
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setShowPasswordForm(null);
                                                                        setPasswordData({ password: '', confirmPassword: '' });
                                                                    }}
                                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Only show Change Password button for logged-in admin's own account */}
                                                                {admin._id === user?.id ? (
                                                                    <button
                                                                        onClick={() => setShowPasswordForm(admin._id)}
                                                                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                    >
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        Change Password
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500 italic">
                                                                        Only you can change your own password
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        toast.error('Contact the system administrator to delete administrators', {
                                                                            duration: 5000,
                                                                            icon: '⚠️',
                                                                        });
                                                                    }}
                                                                    disabled
                                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-400 bg-gray-200 border border-gray-300 cursor-not-allowed opacity-60"
                                                                    title="Contact the system administrator to delete administrators"
                                                                >
                                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <User className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No administrators</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new administrator.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
