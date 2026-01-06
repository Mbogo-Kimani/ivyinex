// Packages page for Eco Wifi Management System
import { useState } from 'react';
import {
    Package,
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
    Wifi,
    Users,
    Activity,
    MoreHorizontal,
    Copy,
    Download,
    Upload
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import PackageDetails from '../components/Packages/PackageDetails';
import PackageForm from '../components/Packages/PackageForm';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Packages = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
    const [importing, setImporting] = useState(false);

    // Get authentication status
    const { isAuthenticated } = useAuth();

    // Fetch packages data only if authenticated
    const { data: packagesData, loading: packagesLoading, refetch: refetchPackages } = useData(apiMethods.getPackages, [], { enabled: isAuthenticated });

    // Filter and search packages
    const filteredPackages = packagesData?.filter(pkg => {
        const matchesSearch = pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg._id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && pkg.active) ||
            (filterStatus === 'inactive' && !pkg.active);

        const matchesTypeFilter = filterType === 'all' ||
            (filterType === 'data' && pkg.type === 'data') ||
            (filterType === 'time' && pkg.type === 'time') ||
            (filterType === 'unlimited' && pkg.type === 'unlimited');

        return matchesSearch && matchesStatusFilter && matchesTypeFilter;
    }) || [];

    // Sort packages
    const sortedPackages = [...filteredPackages].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handlePackageSelect = (packageId) => {
        setSelectedPackages(prev =>
            prev.includes(packageId)
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPackages.length === sortedPackages.length) {
            setSelectedPackages([]);
        } else {
            setSelectedPackages(sortedPackages.map(pkg => pkg._id));
        }
    };

    const handleViewPackage = (pkg) => {
        setSelectedPackage(pkg);
        setShowPackageModal(true);
    };

    const handleEditPackage = (pkg) => {
        setSelectedPackage(pkg);
        setFormMode('edit');
        setShowPackageForm(true);
    };

    const handleCreatePackage = () => {
        setSelectedPackage(null);
        setFormMode('create');
        setShowPackageForm(true);
    };

    const handleSavePackage = async (packageData) => {
        try {
            if (formMode === 'create') {
                await apiMethods.createPackage(packageData);
                toast.success('Package created successfully');
            } else {
                await apiMethods.updatePackage(selectedPackage._id, packageData);
                toast.success('Package updated successfully');
            }
            refetchPackages();
            setShowPackageForm(false);
        } catch (error) {
            console.error('Error saving package:', error);
            toast.error(`Failed to ${formMode === 'create' ? 'create' : 'update'} package`);
        }
    };

    const handleDeletePackage = async (packageId) => {
        if (window.confirm('Are you sure you want to delete this package?')) {
            try {
                await apiMethods.deletePackage(packageId);
                toast.success('Package deleted successfully');
                refetchPackages();
            } catch (error) {
                console.error('Error deleting package:', error);
                toast.error('Failed to delete package');
            }
        }
    };

    const handleDuplicatePackage = async (pkg) => {
        const duplicateData = {
            ...pkg,
            name: `${pkg.name} (Copy)`,
            key: `${pkg.key}_copy_${Date.now()}`,
        };
        delete duplicateData._id;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;

        try {
            await apiMethods.createPackage(duplicateData);
            toast.success('Package duplicated successfully');
            refetchPackages();
        } catch (error) {
            console.error('Error duplicating package:', error);
            toast.error('Failed to duplicate package');
        }
    };

    const handleExport = () => {
        if (!packagesData || packagesData.length === 0) {
            toast.error('No packages to export');
            return;
        }

        // Convert packages to CSV format
        const headers = ['key', 'name', 'priceKES', 'durationSeconds', 'speedKbps', 'devicesAllowed'];
        const csvRows = [
            headers.join(','),
            ...packagesData.map(pkg => [
                `"${pkg.key || ''}"`,
                `"${pkg.name || ''}"`,
                pkg.priceKES || 0,
                pkg.durationSeconds || 0,
                pkg.speedKbps || 0,
                pkg.devicesAllowed || 1
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `packages_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Packages exported successfully');
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            setImporting(true);
            try {
                const text = await file.text();
                let packages = [];

                if (file.name.endsWith('.csv')) {
                    // Parse CSV with proper handling of quoted values
                    const lines = text.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        toast.error('CSV file must have at least a header row and one data row');
                        setImporting(false);
                        return;
                    }
                    
                    // Parse header row
                    const parseCSVLine = (line) => {
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result;
                    };
                    
                    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
                        const pkg = {};
                        headers.forEach((header, index) => {
                            pkg[header] = values[index] || '';
                        });
                        packages.push(pkg);
                    }
                } else if (file.name.endsWith('.json')) {
                    // Parse JSON
                    packages = JSON.parse(text);
                    if (!Array.isArray(packages)) {
                        packages = [packages];
                    }
                }

                // Transform and validate packages
                const validPackages = packages.map(pkg => ({
                    key: pkg.key?.trim(),
                    name: pkg.name?.trim(),
                    priceKES: parseFloat(pkg.priceKES) || 0,
                    durationSeconds: parseInt(pkg.durationSeconds) || 3600,
                    speedKbps: parseInt(pkg.speedKbps) || 1000,
                    devicesAllowed: parseInt(pkg.devicesAllowed) || 1,
                })).filter(pkg => pkg.key && pkg.name);

                if (validPackages.length === 0) {
                    toast.error('No valid packages found in file');
                    setImporting(false);
                    return;
                }

                // Use bulk create endpoint
                await apiMethods.bulkCreatePackages({ packages: validPackages });
                toast.success(`Successfully imported ${validPackages.length} package(s)`);
                refetchPackages();
            } catch (error) {
                console.error('Import error:', error);
                toast.error(`Failed to import packages: ${error.message}`);
            } finally {
                setImporting(false);
            }
        };
        input.click();
    };

    const getStatusBadge = (pkg) => {
        if (pkg.active) {
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
                    Inactive
                </span>
            );
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'data':
                return <Wifi className="h-5 w-5" />;
            case 'time':
                return <Clock className="h-5 w-5" />;
            case 'unlimited':
                return <Activity className="h-5 w-5" />;
            default:
                return <Package className="h-5 w-5" />;
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
                        <p className="text-sm text-gray-500">
                            Manage internet packages and pricing plans
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleExport}
                        disabled={!packagesData || packagesData.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={importing}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {importing ? 'Importing...' : 'Import'}
                    </button>
                    <button
                        onClick={handleCreatePackage}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Package
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
                            placeholder="Search packages..."
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
                        <option value="inactive">Inactive</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="data">Data</option>
                        <option value="time">Time</option>
                        <option value="unlimited">Unlimited</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="name">Name</option>
                        <option value="priceKES">Price</option>
                        <option value="type">Type</option>
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

            {/* Packages Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {packagesLoading ? (
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
                                    checked={selectedPackages.length === sortedPackages.length && sortedPackages.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedPackages.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedPackages.map((pkg) => (
                                <div key={pkg._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedPackages.includes(pkg._id)}
                                            onChange={() => handlePackageSelect(pkg._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                            {/* Package Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(pkg.type)}`}>
                                                        {getTypeIcon(pkg.type)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {pkg.name || 'Unknown Package'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {pkg.key || 'No key'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Type */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className="capitalize">{pkg.type || 'Unknown'}</span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                {formatCurrency(pkg.priceKES || 0)}
                                            </div>

                                            {/* Duration/Data */}
                                            <div className="text-sm text-gray-500">
                                                {pkg.type === 'data' && pkg.dataLimit && (
                                                    <div>{formatNumber(pkg.dataLimit)} MB</div>
                                                )}
                                                {pkg.type === 'time' && pkg.duration && (
                                                    <div>{pkg.duration} hours</div>
                                                )}
                                                {pkg.type === 'unlimited' && (
                                                    <div>Unlimited</div>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(pkg)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewPackage(pkg)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditPackage(pkg)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicatePackage(pkg)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePackage(pkg._id)}
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
                        {sortedPackages.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No packages have been created yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Package Details Modal */}
            {showPackageModal && selectedPackage && (
                <PackageDetails
                    package={selectedPackage}
                    onClose={() => setShowPackageModal(false)}
                />
            )}

            {/* Package Form Modal */}
            {showPackageForm && (
                <PackageForm
                    package={selectedPackage}
                    mode={formMode}
                    onClose={() => setShowPackageForm(false)}
                    onSave={handleSavePackage}
                />
            )}
        </div>
    );
};

export default Packages;
