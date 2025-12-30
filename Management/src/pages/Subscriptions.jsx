// Subscriptions page for Eco Wifi Management System
import { useState } from 'react';
import {
    CreditCard,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    Package,
    DollarSign,
    Activity,
    MoreHorizontal,
    Play,
    Pause,
    RotateCcw
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import SubscriptionDetails from '../components/Subscriptions/SubscriptionDetails';

const Subscriptions = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPackage, setFilterPackage] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    // Fetch subscriptions data
    const { data: subscriptionsData, loading: subscriptionsLoading, refetch: refetchSubscriptions } = useData(apiMethods.getSubscriptions);

    // Filter and search subscriptions
    const filteredSubscriptions = subscriptionsData?.filter(subscription => {
        const matchesSearch = subscription.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.user?.phone?.includes(searchTerm) ||
            subscription.packageKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription._id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && subscription.active) ||
            (filterStatus === 'expired' && !subscription.active) ||
            (filterStatus === 'suspended' && subscription.suspended);

        const matchesPackageFilter = filterPackage === 'all' ||
            subscription.packageKey === filterPackage;

        return matchesSearch && matchesStatusFilter && matchesPackageFilter;
    }) || [];

    // Sort subscriptions
    const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleSubscriptionSelect = (subscriptionId) => {
        setSelectedSubscriptions(prev =>
            prev.includes(subscriptionId)
                ? prev.filter(id => id !== subscriptionId)
                : [...prev, subscriptionId]
        );
    };

    const handleSelectAll = () => {
        if (selectedSubscriptions.length === sortedSubscriptions.length) {
            setSelectedSubscriptions([]);
        } else {
            setSelectedSubscriptions(sortedSubscriptions.map(subscription => subscription._id));
        }
    };

    const handleViewSubscription = (subscription) => {
        setSelectedSubscription(subscription);
        setShowSubscriptionModal(true);
    };

    const handleEditSubscription = (subscription) => {
        setSelectedSubscription(subscription);
        setShowSubscriptionModal(true);
    };

    const handleSaveSubscription = async (updatedSubscription) => {
        try {
            await apiMethods.updateSubscription(selectedSubscription._id, updatedSubscription);
            refetchSubscriptions();
            setShowSubscriptionModal(false);
        } catch (error) {
            console.error('Error updating subscription:', error);
        }
    };

    const handleDeleteSubscription = async (subscriptionId) => {
        if (window.confirm('Are you sure you want to delete this subscription?')) {
            try {
                await apiMethods.deleteSubscription(subscriptionId);
                refetchSubscriptions();
            } catch (error) {
                console.error('Error deleting subscription:', error);
            }
        }
    };

    const handleSuspendSubscription = async (subscriptionId) => {
        try {
            await apiMethods.updateSubscription(subscriptionId, { suspended: true, active: false });
            refetchSubscriptions();
        } catch (error) {
            console.error('Error suspending subscription:', error);
        }
    };

    const handleActivateSubscription = async (subscriptionId) => {
        try {
            await apiMethods.updateSubscription(subscriptionId, { suspended: false, active: true });
            refetchSubscriptions();
        } catch (error) {
            console.error('Error activating subscription:', error);
        }
    };

    const getStatusBadge = (subscription) => {
        if (subscription.suspended) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Pause className="w-3 h-3 mr-1" />
                    Suspended
                </span>
            );
        } else if (subscription.active) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Expired
                </span>
            );
        }
    };

    const getTimeRemaining = (endAt) => {
        if (!endAt) return 'Unknown';

        const now = new Date();
        const endDate = new Date(endAt);
        const diffMs = endDate - now;

        if (diffMs <= 0) return 'Expired';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
        if (diffHours > 0) return `${diffHours}h`;
        return 'Less than 1h';
    };

    // Get unique packages for filter
    const uniquePackages = [...new Set(subscriptionsData?.map(sub => sub.packageKey).filter(Boolean))] || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
                        <p className="text-sm text-gray-500">
                            Manage user subscriptions and monitor usage
                        </p>
                    </div>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Subscription
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search subscriptions..."
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
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="suspended">Suspended</option>
                    </select>

                    {/* Package Filter */}
                    <select
                        value={filterPackage}
                        onChange={(e) => setFilterPackage(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Packages</option>
                        {uniquePackages.map(pkg => (
                            <option key={pkg} value={pkg}>{pkg}</option>
                        ))}
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="startAt">Start Date</option>
                        <option value="endAt">End Date</option>
                        <option value="packageKey">Package</option>
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

            {/* Subscriptions Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {subscriptionsLoading ? (
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
                                    checked={selectedSubscriptions.length === sortedSubscriptions.length && sortedSubscriptions.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedSubscriptions.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedSubscriptions.map((subscription) => (
                                <div key={subscription._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubscriptions.includes(subscription._id)}
                                            onChange={() => handleSubscriptionSelect(subscription._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                            {/* User Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {subscription.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {subscription.user?.phone || 'No phone'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Package Info */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Package className="h-4 w-4 mr-2" />
                                                {subscription.packageKey || 'Unknown Package'}
                                            </div>

                                            {/* Duration */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-2" />
                                                {getTimeRemaining(subscription.endAt)}
                                            </div>

                                            {/* Dates */}
                                            <div className="text-sm text-gray-500">
                                                <div>Start: {formatDate(subscription.startAt)}</div>
                                                <div>End: {formatDate(subscription.endAt)}</div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(subscription)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewSubscription(subscription)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSubscription(subscription)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {subscription.active && !subscription.suspended ? (
                                                    <button
                                                        onClick={() => handleSuspendSubscription(subscription._id)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Suspend"
                                                    >
                                                        <Pause className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivateSubscription(subscription._id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Activate"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteSubscription(subscription._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {sortedSubscriptions.length === 0 && (
                            <div className="text-center py-12">
                                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterPackage !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No subscriptions have been created yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Subscription Details Modal */}
            {showSubscriptionModal && selectedSubscription && (
                <SubscriptionDetails
                    subscription={selectedSubscription}
                    onClose={() => setShowSubscriptionModal(false)}
                    onSave={handleSaveSubscription}
                />
            )}
        </div>
    );
};

export default Subscriptions;
