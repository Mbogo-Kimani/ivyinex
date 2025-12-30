import React, { useState } from 'react';
import {
    Smartphone,
    Monitor,
    Tablet,
    Laptop,
    PhoneIcon,
    Wifi,
    WifiOff,
    MapPin,
    Clock,
    Activity,
    Edit,
    Save,
    X,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Shield,
    Zap
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';

const DeviceDetails = ({ device, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDevice, setEditedDevice] = useState({
        mac: device.mac || '',
        ip: device.ip || '',
        userAgent: device.userAgent || '',
        lastSeen: device.lastSeen || '',
        isBlocked: device.isBlocked || false,
        notes: device.notes || '',
    });

    const handleSave = () => {
        onSave(editedDevice);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedDevice({
            mac: device.mac || '',
            ip: device.ip || '',
            userAgent: device.userAgent || '',
            lastSeen: device.lastSeen || '',
            isBlocked: device.isBlocked || false,
            notes: device.notes || '',
        });
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setEditedDevice(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getDeviceIcon = (userAgent) => {
        if (!userAgent) return <Smartphone className="h-8 w-8" />;

        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return <PhoneIcon className="h-8 w-8" />;
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return <Tablet className="h-8 w-8" />;
        } else if (ua.includes('laptop') || ua.includes('macbook')) {
            return <Laptop className="h-8 w-8" />;
        } else {
            return <Monitor className="h-8 w-8" />;
        }
    };

    const getDeviceType = (userAgent) => {
        if (!userAgent) return 'Unknown';

        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'Mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'Tablet';
        } else if (ua.includes('laptop') || ua.includes('macbook')) {
            return 'Laptop';
        } else {
            return 'Desktop';
        }
    };

    const getLastSeenText = (lastSeen) => {
        if (!lastSeen) return 'Never';

        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMs = now - lastSeenDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getStatusBadge = (device) => {
        const isActive = device.lastSeen &&
            new Date(device.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (device.isBlocked) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Blocked
                </span>
            );
        } else if (isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Inactive
                </span>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                {getDeviceIcon(device.userAgent)}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    {device.mac || 'Unknown Device'}
                                </h3>
                                <p className="text-sm text-gray-500">{getDeviceType(device.userAgent)}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Device Information */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Basic Information
                            </h4>

                            <div>
                                <label className="text-sm font-medium text-gray-500">MAC Address</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedDevice.mac}
                                        onChange={(e) => handleChange('mac', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1 font-mono">{device.mac || 'Unknown'}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">IP Address</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedDevice.ip}
                                        onChange={(e) => handleChange('ip', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{device.ip || 'No IP'}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Device Type</label>
                                <p className="text-sm text-gray-900 mt-1">{getDeviceType(device.userAgent)}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">
                                    {getStatusBadge(device)}
                                </div>
                            </div>
                        </div>

                        {/* Activity Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Activity Information
                            </h4>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Last Seen</label>
                                <p className="text-sm text-gray-900 mt-1">{getLastSeenText(device.lastSeen)}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Created</label>
                                <p className="text-sm text-gray-900 mt-1">{formatDate(device.createdAt)}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Blocked</label>
                                {isEditing ? (
                                    <select
                                        value={editedDevice.isBlocked}
                                        onChange={(e) => handleChange('isBlocked', e.target.value === 'true')}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={false}>No</option>
                                        <option value={true}>Yes</option>
                                    </select>
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{device.isBlocked ? 'Yes' : 'No'}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Notes</label>
                                {isEditing ? (
                                    <textarea
                                        value={editedDevice.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{device.notes || 'No notes'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Agent */}
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                            User Agent
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-900 break-all">{device.userAgent || 'Unknown'}</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Activity className="h-5 w-5 text-blue-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-blue-900">Activity Score</p>
                                    <p className="text-2xl font-bold text-blue-600">85%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Wifi className="h-5 w-5 text-green-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-900">Connection</p>
                                    <p className="text-2xl font-bold text-green-600">Stable</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Shield className="h-5 w-5 text-purple-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-purple-900">Security</p>
                                    <p className="text-2xl font-bold text-purple-600">Good</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceDetails;










