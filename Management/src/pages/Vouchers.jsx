// Vouchers page for Eco Wifi Management System
import { useState } from 'react';
import {
    Gift,
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
    DollarSign,
    Users,
    Activity,
    MoreHorizontal,
    Copy,
    Download,
    Upload,
    QrCode,
    RefreshCw
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import VoucherDetails from '../components/Vouchers/VoucherDetails';
import VoucherForm from '../components/Vouchers/VoucherForm';
import BulkVoucherForm from '../components/Vouchers/BulkVoucherForm';

const Vouchers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedVouchers, setSelectedVouchers] = useState([]);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [showVoucherForm, setShowVoucherForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'

    // Fetch vouchers data
    const { data: vouchersData, loading: vouchersLoading, refetch: refetchVouchers } = useData(apiMethods.getVouchers);

    // Filter and search vouchers
    const filteredVouchers = vouchersData?.filter(voucher => {
        const matchesSearch = voucher.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voucher.packageKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voucher._id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && voucher.active && !voucher.used) ||
            (filterStatus === 'used' && voucher.used) ||
            (filterStatus === 'expired' && voucher.expired) ||
            (filterStatus === 'inactive' && !voucher.active);

        const matchesTypeFilter = filterType === 'all' ||
            (filterType === 'single' && voucher.type === 'single') ||
            (filterType === 'bulk' && voucher.type === 'bulk');

        return matchesSearch && matchesStatusFilter && matchesTypeFilter;
    }) || [];

    // Sort vouchers
    const sortedVouchers = [...filteredVouchers].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleVoucherSelect = (voucherId) => {
        setSelectedVouchers(prev =>
            prev.includes(voucherId)
                ? prev.filter(id => id !== voucherId)
                : [...prev, voucherId]
        );
    };

    const handleSelectAll = () => {
        if (selectedVouchers.length === sortedVouchers.length) {
            setSelectedVouchers([]);
        } else {
            setSelectedVouchers(sortedVouchers.map(voucher => voucher._id));
        }
    };

    const handleViewVoucher = (voucher) => {
        setSelectedVoucher(voucher);
        setShowVoucherModal(true);
    };

    const handleEditVoucher = (voucher) => {
        setSelectedVoucher(voucher);
        setFormMode('edit');
        setShowVoucherForm(true);
    };

    const handleCreateVoucher = () => {
        setSelectedVoucher(null);
        setFormMode('create');
        setShowVoucherForm(true);
    };

    const handleBulkCreate = () => {
        setShowBulkForm(true);
    };

    const handleSaveVoucher = async (voucherData) => {
        try {
            if (formMode === 'create') {
                await apiMethods.createVoucher(voucherData);
            } else {
                await apiMethods.updateVoucher(selectedVoucher._id, voucherData);
            }
            refetchVouchers();
            setShowVoucherForm(false);
        } catch (error) {
            console.error('Error saving voucher:', error);
        }
    };

    const handleBulkSave = async (bulkData) => {
        try {
            // This would be implemented in the backend
            await apiMethods.bulkCreateVouchers(bulkData);
            refetchVouchers();
            setShowBulkForm(false);
        } catch (error) {
            console.error('Error creating bulk vouchers:', error);
        }
    };

    const handleDeleteVoucher = async (voucherId) => {
        if (window.confirm('Are you sure you want to delete this voucher?')) {
            try {
                await apiMethods.deleteVoucher(voucherId);
                refetchVouchers();
            } catch (error) {
                console.error('Error deleting voucher:', error);
            }
        }
    };

    const handleDuplicateVoucher = async (voucher) => {
        const duplicateData = {
            ...voucher,
            code: `${voucher.code}_copy_${Date.now()}`,
        };
        delete duplicateData._id;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;

        try {
            await apiMethods.createVoucher(duplicateData);
            refetchVouchers();
        } catch (error) {
            console.error('Error duplicating voucher:', error);
        }
    };

    const getStatusBadge = (voucher) => {
        if (voucher.used) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Used
                </span>
            );
        } else if (voucher.expired) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Expired
                </span>
            );
        } else if (voucher.active) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Inactive
                </span>
            );
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'single':
                return <Gift className="h-5 w-5" />;
            case 'bulk':
                return <Users className="h-5 w-5" />;
            default:
                return <Gift className="h-5 w-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'single':
                return 'text-blue-600 bg-blue-100';
            case 'bulk':
                return 'text-purple-600 bg-purple-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return 'No expiry';

        const now = new Date();
        const expiryDate = new Date(expiresAt);
        const diffMs = expiryDate - now;

        if (diffMs <= 0) return 'Expired';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
        if (diffHours > 0) return `${diffHours}h`;
        return 'Less than 1h';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Gift className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
                        <p className="text-sm text-gray-500">
                            Manage voucher codes and track usage
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
                    <button
                        onClick={handleBulkCreate}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Bulk Create
                    </button>
                    <button
                        onClick={handleCreateVoucher}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Voucher
                    </button>
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
                            placeholder="Search vouchers..."
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
                        <option value="used">Used</option>
                        <option value="expired">Expired</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="single">Single Use</option>
                        <option value="bulk">Bulk</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="code">Voucher Code</option>
                        <option value="expiresAt">Expiry Date</option>
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

            {/* Vouchers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {vouchersLoading ? (
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
                                    checked={selectedVouchers.length === sortedVouchers.length && sortedVouchers.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedVouchers.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedVouchers.map((voucher) => (
                                <div key={voucher._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedVouchers.includes(voucher._id)}
                                            onChange={() => handleVoucherSelect(voucher._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                            {/* Voucher Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(voucher.type)}`}>
                                                        {getTypeIcon(voucher.type)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 font-mono">
                                                        {voucher.code || 'No code'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {voucher.packageKey || 'No package'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Type */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className="capitalize">{voucher.type || 'Unknown'}</span>
                                            </div>

                                            {/* Value */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                {formatCurrency(voucher.value || 0)}
                                            </div>

                                            {/* Expiry */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-2" />
                                                {getTimeRemaining(voucher.expiresAt)}
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(voucher)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewVoucher(voucher)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditVoucher(voucher)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicateVoucher(voucher)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVoucher(voucher._id)}
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
                        {sortedVouchers.length === 0 && (
                            <div className="text-center py-12">
                                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No vouchers found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No vouchers have been created yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Voucher Details Modal */}
            {showVoucherModal && selectedVoucher && (
                <VoucherDetails
                    voucher={selectedVoucher}
                    onClose={() => setShowVoucherModal(false)}
                />
            )}

            {/* Voucher Form Modal */}
            {showVoucherForm && (
                <VoucherForm
                    voucher={selectedVoucher}
                    mode={formMode}
                    onClose={() => setShowVoucherForm(false)}
                    onSave={handleSaveVoucher}
                />
            )}

            {/* Bulk Voucher Form Modal */}
            {showBulkForm && (
                <BulkVoucherForm
                    onClose={() => setShowBulkForm(false)}
                    onSave={handleBulkSave}
                />
            )}
        </div>
    );
};

export default Vouchers;
