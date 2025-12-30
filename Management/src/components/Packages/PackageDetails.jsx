// PackageDetails component for Eco Wifi Management System
import {
    X,
    Package,
    DollarSign,
    Clock,
    Wifi,
    Activity,
    CheckCircle,
    XCircle,
    Calendar,
    Users,
    BarChart3,
    Settings,
    Info
} from 'lucide-react';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

const PackageDetails = ({ package: pkg, onClose }) => {
    const getTypeIcon = (type) => {
        switch (type) {
            case 'data':
                return <Wifi className="h-6 w-6 text-blue-600" />;
            case 'time':
                return <Clock className="h-6 w-6 text-green-600" />;
            case 'unlimited':
                return <Activity className="h-6 w-6 text-purple-600" />;
            default:
                return <Package className="h-6 w-6 text-gray-600" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'data':
                return 'text-blue-600 bg-blue-100';
            case 'time':
                return 'text-green-600 bg-green-100';
            case 'unlimited':
                return 'text-purple-600 bg-purple-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusBadge = () => {
        if (pkg.active) {
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
                    Inactive
                </span>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        {getTypeIcon(pkg.type)}
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                                {pkg.name || 'Unknown Package'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Key: {pkg.key || 'No key'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left Column - Package Info */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                            <div className="flex items-center justify-between">
                                {getStatusBadge()}
                                <div className="text-sm text-gray-500">
                                    Created: {formatDate(pkg.createdAt)}
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
                                            {pkg.name || 'Unknown Package'}
                                        </div>
                                        <div className="text-sm text-gray-500">Package Name</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Settings className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {pkg.key || 'No key'}
                                        </div>
                                        <div className="text-sm text-gray-500">Package Key</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(pkg.price || 0)}
                                        </div>
                                        <div className="text-sm text-gray-500">Price</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className={`h-4 w-4 mr-3 rounded-full flex items-center justify-center ${getTypeColor(pkg.type)}`}>
                                        {getTypeIcon(pkg.type)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 capitalize">
                                            {pkg.type || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-gray-500">Package Type</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Package Details */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Package Details</h4>
                            <div className="space-y-3">
                                {pkg.type === 'data' && (
                                    <>
                                        <div className="flex items-center">
                                            <Wifi className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatNumber(pkg.dataLimit || 0)} MB
                                                </div>
                                                <div className="text-sm text-gray-500">Data Limit</div>
                                            </div>
                                        </div>
                                        {pkg.speedLimit && (
                                            <div className="flex items-center">
                                                <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatNumber(pkg.speedLimit)} Mbps
                                                    </div>
                                                    <div className="text-sm text-gray-500">Speed Limit</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {pkg.type === 'time' && (
                                    <>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {pkg.duration || 0} hours
                                                </div>
                                                <div className="text-sm text-gray-500">Duration</div>
                                            </div>
                                        </div>
                                        {pkg.speedLimit && (
                                            <div className="flex items-center">
                                                <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatNumber(pkg.speedLimit)} Mbps
                                                    </div>
                                                    <div className="text-sm text-gray-500">Speed Limit</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {pkg.type === 'unlimited' && (
                                    <div className="flex items-center">
                                        <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Unlimited Access
                                            </div>
                                            <div className="text-sm text-gray-500">No data or time limits</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {pkg.description && (
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
                                <p className="text-sm text-gray-700">
                                    {pkg.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Statistics */}
                    <div className="space-y-6">
                        {/* Usage Statistics */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Statistics</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Active Subscriptions</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {pkg.activeSubscriptions || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <BarChart3 className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Total Subscriptions</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {pkg.totalSubscriptions || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Total Revenue</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(pkg.totalRevenue || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Package ID</span>
                                    <span className="text-sm font-medium text-gray-900 font-mono">
                                        {pkg._id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Created</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(pkg.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(pkg.updatedAt)}
                                    </span>
                                </div>
                                {pkg.priority && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Priority</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {pkg.priority}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Features */}
                        {pkg.features && pkg.features.length > 0 && (
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Features</h4>
                                <div className="space-y-2">
                                    {pkg.features.map((feature, index) => (
                                        <div key={index} className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Restrictions */}
                        {pkg.restrictions && pkg.restrictions.length > 0 && (
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Restrictions</h4>
                                <div className="space-y-2">
                                    {pkg.restrictions.map((restriction, index) => (
                                        <div key={index} className="flex items-center">
                                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                            <span className="text-sm text-gray-700">{restriction}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetails;
