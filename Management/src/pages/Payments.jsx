// Payments page for Eco Wifi Management System
import { useState } from 'react';
import {
    DollarSign,
    Search,
    Filter,
    Eye,
    Download,
    Upload,
    Calendar,
    CreditCard,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    Users,
    Smartphone,
    Wifi,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import PaymentDetails from '../components/Payments/PaymentDetails';

const Payments = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProvider, setFilterProvider] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Fetch payments data
    const { data: paymentsData, loading: paymentsLoading, refetch: refetchPayments } = useData(apiMethods.getPayments);

    // Filter and search payments
    const filteredPayments = paymentsData?.filter(payment => {
        const matchesSearch = payment.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.phone?.includes(searchTerm) ||
            payment._id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = filterStatus === 'all' ||
            (filterStatus === 'successful' && payment.status === 'successful') ||
            (filterStatus === 'pending' && payment.status === 'pending') ||
            (filterStatus === 'failed' && payment.status === 'failed');

        const matchesProviderFilter = filterProvider === 'all' ||
            payment.provider === filterProvider;

        return matchesSearch && matchesStatusFilter && matchesProviderFilter;
    }) || [];

    // Sort payments
    const sortedPayments = [...filteredPayments].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handlePaymentSelect = (paymentId) => {
        setSelectedPayments(prev =>
            prev.includes(paymentId)
                ? prev.filter(id => id !== paymentId)
                : [...prev, paymentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPayments.length === sortedPayments.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(sortedPayments.map(payment => payment._id));
        }
    };

    const handleViewPayment = (payment) => {
        setSelectedPayment(payment);
        setShowPaymentModal(true);
    };

    const getStatusBadge = (payment) => {
        switch (payment.status) {
            case 'successful':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Successful
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unknown
                    </span>
                );
        }
    };

    const getProviderIcon = (provider) => {
        switch (provider?.toLowerCase()) {
            case 'mpesa':
                return <Smartphone className="h-5 w-5 text-green-600" />;
            case 'airtel money':
                return <Smartphone className="h-5 w-5 text-red-600" />;
            case 'visa':
            case 'mastercard':
                return <CreditCard className="h-5 w-5 text-blue-600" />;
            default:
                return <DollarSign className="h-5 w-5 text-gray-600" />;
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

    // Calculate statistics
    const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amountKES || 0), 0) || 0;
    const successfulPayments = paymentsData?.filter(p => p.status === 'successful').length || 0;
    const pendingPayments = paymentsData?.filter(p => p.status === 'pending').length || 0;
    const failedPayments = paymentsData?.filter(p => p.status === 'failed').length || 0;
    const successRate = paymentsData?.length > 0 ? (successfulPayments / paymentsData.length) * 100 : 0;

    // Get unique providers for filter
    const uniqueProviders = [...new Set(paymentsData?.map(p => p.provider).filter(Boolean))] || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                        <p className="text-sm text-gray-500">
                            Monitor transactions and revenue analytics
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Revenue
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {formatCurrency(totalRevenue)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Successful
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {formatNumber(successfulPayments)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Pending
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {formatNumber(pendingPayments)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Success Rate
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {formatNumber(successRate)}%
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="successful">Successful</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>

                    {/* Provider Filter */}
                    <select
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Providers</option>
                        {uniqueProviders.map(provider => (
                            <option key={provider} value={provider}>{provider}</option>
                        ))}
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="amountKES">Amount</option>
                        <option value="provider">Provider</option>
                        <option value="status">Status</option>
                    </select>

                    {/* Sort Order */}
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {paymentsLoading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <div className="h-4 bg-gray-200 rounded w-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedPayments.length === sortedPayments.length && sortedPayments.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedPayments.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedPayments.map((payment) => (
                                <div key={payment._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedPayments.includes(payment._id)}
                                            onChange={() => handlePaymentSelect(payment._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                            {/* Payment Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getProviderColor(payment.provider)}`}>
                                                        {getProviderIcon(payment.provider)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {payment.provider || 'Unknown Provider'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.phone || 'No phone'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction ID */}
                                            <div className="flex items-center text-sm text-gray-500 font-mono">
                                                {payment.transactionId || 'No ID'}
                                            </div>

                                            {/* Amount */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                {formatCurrency(payment.amountKES || 0)}
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {formatDate(payment.createdAt)}
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(payment)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewPayment(payment)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {sortedPayments.length === 0 && (
                            <div className="text-center py-12">
                                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterProvider !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No payments have been recorded yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Payment Details Modal */}
            {showPaymentModal && selectedPayment && (
                <PaymentDetails
                    payment={selectedPayment}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}
        </div>
    );
};

export default Payments;
