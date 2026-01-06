import React, { useState } from 'react';
import {
    User,
    Phone,
    Mail,
    Calendar,
    CheckCircle,
    XCircle,
    Edit,
    Save,
    X,
    Wifi,
    CreditCard,
    Gift
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';

const UserDetails = ({ user, onClose, onSave }) => {
    const isNewUser = !user || !user._id;
    const [isEditing, setIsEditing] = useState(isNewUser);
    const [editedUser, setEditedUser] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
        phoneVerified: user?.phoneVerified || false,
        points: user?.points || 0,
    });

    const handleSave = () => {
        onSave(editedUser);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedUser({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            password: '',
            phoneVerified: user?.phoneVerified || false,
            points: user?.points || 0,
        });
        if (isNewUser) {
            onClose();
        } else {
            setIsEditing(false);
        }
    };

    const handleChange = (field, value) => {
        setEditedUser(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                    <span className="text-lg font-medium text-blue-600">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {isNewUser ? 'Create New User' : (user?.name || 'Unknown User')}
                                    </h3>
                                    <p className="text-sm text-gray-500">{isNewUser ? 'Add a new user account' : 'User Details'}</p>
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

                    {/* User Information */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Basic Information
                            </h4>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedUser.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{user.name || 'Unknown'}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editedUser.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{user.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Email {isNewUser && '*'}</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        required={isNewUser}
                                        value={editedUser.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{user?.email || 'No email'}</p>
                                )}
                            </div>

                            {isNewUser && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={editedUser.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter password"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">
                                    {user.phoneVerified ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Account Information
                            </h4>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Points Balance</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editedUser.points}
                                        onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 mt-1">{formatNumber(user.points || 0)}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Free Trial Used</label>
                                <p className="text-sm text-gray-900 mt-1">
                                    {user.freeTrialUsed ? 'Yes' : 'No'}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Referral Code</label>
                                <p className="text-sm text-gray-900 mt-1">{user.referralCode || 'None'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Created</label>
                                <p className="text-sm text-gray-900 mt-1">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Wifi className="h-5 w-5 text-blue-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-blue-900">Active Devices</p>
                                    <p className="text-2xl font-bold text-blue-600">0</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-900">Total Payments</p>
                                    <p className="text-2xl font-bold text-green-600">0</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Gift className="h-5 w-5 text-purple-600" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-purple-900">Referrals</p>
                                    <p className="text-2xl font-bold text-purple-600">0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;










