// SubscriptionDetails component for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    X,
    User,
    Package,
    Calendar,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    Pause,
    Play,
    RotateCcw,
    Activity,
    Wifi,
    WifiOff,
    Phone,
    Mail,
    MapPin,
    Smartphone
} from 'lucide-react';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

const SubscriptionDetails = ({ subscription, onClose, onSave }) => {
    const isNewSubscription = !subscription || !subscription._id;
    const [isEditing, setIsEditing] = useState(isNewSubscription);
    const [formData, setFormData] = useState({
        userId: subscription?.userId || '',
        packageKey: subscription?.packageKey || '',
        active: subscription?.active || false,
        suspended: subscription?.suspended || false,
        startAt: subscription?.startAt ? new Date(subscription.startAt).toISOString().slice(0, 16) : '',
        endAt: subscription?.endAt ? new Date(subscription.endAt).toISOString().slice(0, 16) : '',
        notes: subscription?.notes || '',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subscription && subscription._id) {
            setFormData({
                userId: subscription.userId || '',
                packageKey: subscription.packageKey || '',
                active: subscription.active || false,
                suspended: subscription.suspended || false,
                startAt: subscription.startAt ? new Date(subscription.startAt).toISOString().slice(0, 16) : '',
                endAt: subscription.endAt ? new Date(subscription.endAt).toISOString().slice(0, 16) : '',
                notes: subscription.notes || '',
            });
        } else if (isNewSubscription) {
            // Initialize with default values for new subscription
            const now = new Date();
            setFormData({
                userId: '',
                packageKey: '',
                active: true,
                suspended: false,
                startAt: now.toISOString().slice(0, 16),
                endAt: '',
                notes: '',
            });
        }
    }, [subscription, isNewSubscription]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (subscription && subscription._id) {
            setFormData({
                userId: subscription.userId || '',
                packageKey: subscription.packageKey || '',
                active: subscription.active || false,
                suspended: subscription.suspended || false,
                startAt: subscription.startAt ? new Date(subscription.startAt).toISOString().slice(0, 16) : '',
                endAt: subscription.endAt ? new Date(subscription.endAt).toISOString().slice(0, 16) : '',
                notes: subscription.notes || '',
            });
            setIsEditing(false);
        } else {
            onClose();
        }
    };

    const getStatusBadge = () => {
        if (!subscription) return null;
        if (subscription.suspended) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Pause className="w-4 h-4 mr-2" />
                    Suspended
                </span>
            );
        } else if (subscription.active) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="w-4 h-4 mr-2" />
                    Expired
                </span>
            );
        }
    };

    const getTimeRemaining = () => {
        if (!subscription || !subscription.endAt) return 'Unknown';

        const now = new Date();
        const endDate = new Date(subscription.endAt);
        const diffMs = endDate - now;

        if (diffMs <= 0) return 'Expired';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays} days, ${diffHours} hours`;
        if (diffHours > 0) return `${diffHours} hours`;
        return 'Less than 1 hour';
    };

    const getDuration = () => {
        if (!subscription || !subscription.startAt || !subscription.endAt) return 'Unknown';

        const startDate = new Date(subscription.startAt);
        const endDate = new Date(subscription.endAt);
        const diffMs = endDate - startDate;

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays} days, ${diffHours} hours`;
        if (diffHours > 0) return `${diffHours} hours`;
        return 'Less than 1 hour';
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                {isNewSubscription ? 'Create New Subscription' : 'Subscription Details'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {isNewSubscription ? 'Add a new subscription' : `ID: ${subscription._id}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCancel}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column - Subscription Info */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                            <div className="flex items-center justify-between">
                                {getStatusBadge()}
                                <div className="text-sm text-gray-500">
                                    {getTimeRemaining()} remaining
                                </div>
                            </div>
                        </div>

                        {/* Package Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Package Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Package className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="packageKey"
                                                    value={formData.packageKey}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                subscription?.packageKey || 'Unknown Package'
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">Package Key</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {getDuration()}
                                        </div>
                                        <div className="text-sm text-gray-500">Duration</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="datetime-local"
                                                    name="startAt"
                                                    value={formData.startAt ? new Date(formData.startAt).toISOString().slice(0, 16) : ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                subscription?.startAt ? formatDate(subscription.startAt) : 'Not set'
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">Start Date</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="datetime-local"
                                                    name="endAt"
                                                    value={formData.endAt ? new Date(formData.endAt).toISOString().slice(0, 16) : ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                subscription?.endAt ? formatDate(subscription.endAt) : 'Not set'
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">End Date</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        {isEditing && (
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Settings</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="suspended"
                                            checked={formData.suspended}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Suspended</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - User Info */}
                    <div className="space-y-6">
                        {/* User Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">User Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {subscription.user?.name || 'Unknown User'}
                                        </div>
                                        <div className="text-sm text-gray-500">Full Name</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {subscription.user?.phone || 'No phone'}
                                        </div>
                                        <div className="text-sm text-gray-500">Phone Number</div>
                                    </div>
                                </div>
                                {subscription.user?.email && (
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {subscription.user.email}
                                            </div>
                                            <div className="text-sm text-gray-500">Email Address</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Usage Statistics */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Statistics</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Data Used</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {subscription.dataUsed || '0 MB'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Session Time</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {subscription.sessionTime || '0 minutes'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Wifi className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Last Active</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {subscription.lastActive ? formatDate(subscription.lastActive) : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                            {isEditing ? (
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add notes about this subscription..."
                                />
                            ) : (
                                <p className="text-sm text-gray-700">
                                    {subscription.notes || 'No notes available'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionDetails;
