// PaymentDetails component for Eco Wifi Management System
import {
    X,
    DollarSign,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    CreditCard,
    Smartphone,
    Users,
    Activity,
    TrendingUp,
    TrendingDown,
    Info,
    Copy,
    Download
} from 'lucide-react';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

const PaymentDetails = ({ payment, onClose }) => {
    const getStatusBadge = () => {
        switch (payment.status) {
            case 'successful':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Successful
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-2" />
                        Pending
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-2" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Unknown
                    </span>
                );
        }
    };

    const getProviderIcon = (provider) => {
        switch (provider?.toLowerCase()) {
            case 'mpesa':
                return <Smartphone className="h-6 w-6 text-green-600" />;
            case 'airtel money':
                return <Smartphone className="h-6 w-6 text-red-600" />;
            case 'visa':
            case 'mastercard':
                return <CreditCard className="h-6 w-6 text-blue-600" />;
            default:
                return <DollarSign className="h-6 w-6 text-gray-600" />;
        }
    };

    const getProviderColor = (provider) => {
        switch (provider?.toLowerCase()) {
            case 'mpesa':
                return 'text-green-600 bg-green-100';
            case 'airtel money':
                return 'text-red-600 bg-red-100';
            case 'visa':
            case 'mastercard':
                return 'text-blue-600 bg-blue-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    const downloadReceipt = () => {
        // This would generate a PDF receipt
        console.log('Download receipt for payment:', payment._id);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        {getProviderIcon(payment.provider)}
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                                Payment Details
                            </h3>
                            <p className="text-sm text-gray-500">
                                Transaction ID: {payment.transactionId || payment._id}
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
                    {/* Left Column - Payment Info */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                            <div className="flex items-center justify-between">
                                {getStatusBadge()}
                                <div className="text-sm text-gray-500">
                                    {formatDate(payment.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(payment.amountKES || 0)}
                                        </div>
                                        <div className="text-sm text-gray-500">Amount</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className={`h-4 w-4 mr-3 rounded-full flex items-center justify-center ${getProviderColor(payment.provider)}`}>
                                        {getProviderIcon(payment.provider)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {payment.provider || 'Unknown Provider'}
                                        </div>
                                        <div className="text-sm text-gray-500">Payment Provider</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Activity className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 font-mono">
                                            {payment.transactionId || 'No Transaction ID'}
                                        </div>
                                        <div className="text-sm text-gray-500">Transaction ID</div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(payment.transactionId)}
                                        className="ml-auto text-blue-600 hover:text-blue-800"
                                        title="Copy transaction ID"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {payment.phone || 'No phone number'}
                                        </div>
                                        <div className="text-sm text-gray-500">Phone Number</div>
                                    </div>
                                </div>
                                {payment.customerName && (
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 text-gray-400 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {payment.customerName}
                                            </div>
                                            <div className="text-sm text-gray-500">Customer Name</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => copyToClipboard(payment.transactionId)}
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Transaction ID
                                </button>
                                <button
                                    onClick={downloadReceipt}
                                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Receipt
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Transaction Details */}
                    <div className="space-y-6">
                        {/* Transaction Timeline */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Timeline</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-500">Initiated</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(payment.createdAt)}
                                    </span>
                                </div>
                                {payment.processedAt && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-gray-400 mr-3" />
                                            <span className="text-sm text-gray-500">Processed</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDate(payment.processedAt)}
                                        </span>
                                    </div>
                                )}
                                {payment.completedAt && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                                            <span className="text-sm text-gray-500">Completed</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDate(payment.completedAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Payment ID</span>
                                    <span className="text-sm font-medium text-gray-900 font-mono">
                                        {payment._id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Created</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(payment.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDate(payment.updatedAt)}
                                    </span>
                                </div>
                                {payment.reference && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Reference</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {payment.reference}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Details */}
                        <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Provider</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {payment.provider || 'Unknown'}
                                    </span>
                                </div>
                                {payment.accountNumber && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Account</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {payment.accountNumber}
                                        </span>
                                    </div>
                                )}
                                {payment.cardLast4 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Card</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            **** **** **** {payment.cardLast4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Information */}
                        {payment.status === 'failed' && payment.errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800">Error Details</h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            {payment.errorMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Information */}
                        {payment.status === 'successful' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-green-800">Payment Successful</h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            This payment has been processed successfully.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pending Information */}
                        {payment.status === 'pending' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-yellow-800">Payment Pending</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            This payment is being processed. Please wait for confirmation.
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

export default PaymentDetails;
