// Devices page for Eco Wifi Management System
import { useState } from 'react';
import {
    Smartphone,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Wifi,
    WifiOff,
    Monitor,
    Smartphone as PhoneIcon,
    Tablet,
    Laptop,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Activity
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatNumber } from '../utils/formatters';
import DeviceDetails from '../components/Devices/DeviceDetails';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Devices = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // Get authentication status
    const { isAuthenticated } = useAuth();

    // Fetch devices data only if authenticated
    const { data: devicesData, loading: devicesLoading, refetch: refetchDevices } = useData(apiMethods.getDevices, [], { enabled: isAuthenticated });

    // Filter and search devices
    const filteredDevices = devicesData?.filter(device => {
        const matchesSearch = device.mac?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.ip?.includes(searchTerm) ||
            device.userAgent?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && device.lastSeen &&
                new Date(device.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)) ||
            (filterStatus === 'inactive' && (!device.lastSeen ||
                new Date(device.lastSeen) <= new Date(Date.now() - 24 * 60 * 60 * 1000)));

        const matchesTypeFilter = filterType === 'all' ||
            (filterType === 'mobile' && device.userAgent?.toLowerCase().includes('mobile')) ||
            (filterType === 'desktop' && !device.userAgent?.toLowerCase().includes('mobile'));

        return matchesSearch && matchesStatusFilter && matchesTypeFilter;
    }) || [];

    // Sort devices
    const sortedDevices = [...filteredDevices].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleDeviceSelect = (deviceId) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDevices.length === sortedDevices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(sortedDevices.map(device => device._id));
        }
    };

    const handleViewDevice = (device) => {
        setSelectedDevice(device);
        setShowDeviceModal(true);
    };

    const handleEditDevice = (device) => {
        setSelectedDevice(device);
        setShowDeviceModal(true);
    };

    const handleSaveDevice = async (deviceData) => {
        try {
            if (selectedDevice && selectedDevice.mac) {
                // Update existing device
                await apiMethods.updateDevice(selectedDevice.mac, deviceData);
                toast.success('Device updated successfully');
            } else {
                // Create new device - note: devices are usually auto-registered
                // This would require a create endpoint on the backend
                toast('Devices are typically registered automatically when users connect. Manual creation requires backend support.', { icon: 'ℹ️' });
            }
            refetchDevices();
            setShowDeviceModal(false);
        } catch (error) {
            console.error('Error saving device:', error);
            toast.error('Failed to save device');
        }
    };

    const handleDeleteDevice = async (device) => {
        if (window.confirm('Are you sure you want to delete this device?')) {
            try {
                // Note: Backend doesn't have deleteDevice endpoint, so we'll just mark it
                // In production, you might want to add a delete endpoint
                toast('Device deletion is not available. Contact system administrator.', { icon: 'ℹ️' });
                // await apiMethods.updateDevice(device.mac, { deleted: true });
                // refetchDevices();
            } catch (error) {
                console.error('Error deleting device:', error);
                toast.error('Failed to delete device');
            }
        }
    };

    const getDeviceIcon = (userAgent) => {
        if (!userAgent) return <Smartphone className="h-5 w-5" />;

        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return <PhoneIcon className="h-5 w-5" />;
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return <Tablet className="h-5 w-5" />;
        } else if (ua.includes('laptop') || ua.includes('macbook')) {
            return <Laptop className="h-5 w-5" />;
        } else {
            return <Monitor className="h-5 w-5" />;
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

    const getStatusBadge = (device) => {
        const isActive = device.lastSeen &&
            new Date(device.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (isActive) {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
                        <p className="text-sm text-gray-500">
                            Manage connected devices and monitor activity
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setSelectedDevice(null);
                        setShowDeviceModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Device
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
                            placeholder="Search devices..."
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
                        <option value="all">All Devices</option>
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
                        <option value="mobile">Mobile</option>
                        <option value="desktop">Desktop</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="lastSeen">Last Seen</option>
                        <option value="mac">MAC Address</option>
                        <option value="ip">IP Address</option>
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

            {/* Devices Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {devicesLoading ? (
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
                                    checked={selectedDevices.length === sortedDevices.length && sortedDevices.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedDevices.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedDevices.map((device) => (
                                <div key={device._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedDevices.includes(device._id)}
                                            onChange={() => handleDeviceSelect(device._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-5">
                                            {/* Device Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        {getDeviceIcon(device.userAgent)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {device.mac || 'Unknown MAC'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {getDeviceType(device.userAgent)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* IP Address */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {device.ip || 'No IP'}
                                            </div>

                                            {/* Last Seen */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-2" />
                                                {getLastSeenText(device.lastSeen)}
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(device)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewDevice(device)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDevice(device)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDevice(device)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Device"
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
                        {sortedDevices.length === 0 && (
                            <div className="text-center py-12">
                                <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No devices have been registered yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Device Details Modal */}
            {showDeviceModal && selectedDevice && (
                <DeviceDetails
                    device={selectedDevice}
                    onClose={() => setShowDeviceModal(false)}
                    onSave={handleSaveDevice}
                />
            )}
        </div>
    );
};

export default Devices;
