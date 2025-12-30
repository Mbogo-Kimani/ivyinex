// VoucherDetails component for Eco Wifi Management System
import {
    X,
    Gift,
    DollarSign,
    Clock,
    Calendar,
    CheckCircle,
    XCircle,
    Users,
    Package,
    QrCode,
    Copy,
    Download,
    Activity,
    AlertCircle,
    Info
} from 'lucide-react';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

const VoucherDetails = ({ voucher, onClose }) => {
    const getStatusBadge = () => {
        if (voucher.used) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Used
                </span>
            );
        } else if (voucher.expired) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="w-4 h-4 mr-2" />
                    Expired
                </span>
            );
        } else if (voucher.active) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-4 h-4 mr-2" />
                    Inactive
                </span>
            );
        }
    };

    const getTimeRemaining = () => {
        if (!voucher.expiresAt) return 'No expiry';

        const now = new Date();
        const expiryDate = new Date(voucher.expiresAt);
        const diffMs = expiryDate - now;

        if (diffMs <= 0) return 'Expired';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays} days, ${diffHours} hours`;
        if (diffHours > 0) return `${diffHours} hours`;
        return 'Less than 1 hour';
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    const downloadVoucher = () => {
        // This would generate a PDF or image of the voucher
        console.log('Download voucher:', voucher.code);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Gift className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Voucher Details
                            </h3>
                            <p className="text-sm text-gray-500">
                                Code: {voucher.code}
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
                    {/* Left Column - Voucher Info */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                            <div className="flex items-center justify-between">
                                {getStatusBadge()}
                                <div className="text-sm text-gray-500">
                                    {getTimeRemaining()}
                                </div>
                            </div>
                        </div>

                        {/* Voucher Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Voucher Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Gift className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 font-mono">
                                            {voucher.code || 'No code'}
                                        </div>
                                        <div className="text-sm text-gray-500">Voucher Code</div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(voucher.code)}
                                        className="ml-auto text-blue-600 hover:text-blue-800"
                                        title="Copy code"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center">
                                    <Package className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {voucher.packageKey || 'No package'}
                                        </div>
                                        <div className="text-sm text-gray-500">Package</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(voucher.value || 0)}
                                        </div>
                                        <div className="text-sm text-gray-500">Value</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 capitalize">
                                            {voucher.type || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-gray-500">Type</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">QR Code</h4>
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">QR Code Preview</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {voucher.code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => copyToClipboard(voucher.code)}
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Code
                                </button>
                                <button
                                    onClick={downloadVoucher}
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Usage & Details */}
                    <div className="space-y-6">
                        {/* Usage Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Used</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {voucher.used ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                {voucher.used && voucher.usedAt && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                            <span className="text-sm text-gray-500">Used At</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDate(voucher.usedAt)}
                                        </span>
                                    </div>
                                )}
                                {voucher.usedBy && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 text-gray-400 mr-3" />
                                            <span className="text-sm text-gray-500">Used By</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {voucher.usedBy.name || voucher.usedBy.phone || 'Unknown User'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expiry Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Expiry Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Expires At</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {voucher.expiresAt ? formatDate(voucher.expiresAt) : 'Never'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Time Remaining</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {getTimeRemaining()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Voucher ID</span>
                                    <span className="text-sm font-medium text-gray-900 font-mono">
                                        {voucher._id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Created</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(voucher.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(voucher.updatedAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Active</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {voucher.active ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {voucher.notes && (
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                                <p className="text-sm text-gray-700">
                                    {voucher.notes}
                                </p>
                            </div>
                        )}

                        {/* Warnings */}
                        {voucher.expired && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800">Expired Voucher</h4>
                                        <p className="text-sm text-red-700">
                                            This voucher has expired and cannot be used.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {voucher.used && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <Info className="h-5 w-5 text-gray-400 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-800">Used Voucher</h4>
                                        <p className="text-sm text-gray-700">
                                            This voucher has already been used and cannot be used again.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherDetails;
