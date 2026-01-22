// Users page for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    Users as UsersIcon,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Phone,
    Mail,
    Calendar,
    CheckCircle,
    XCircle,
    MoreHorizontal
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate, formatNumber } from '../utils/formatters';
import UserDetails from '../components/Users/UserDetails';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Users = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Get authentication status
    const { isAuthenticated } = useAuth();

    // Fetch users data only if authenticated
    const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useData(apiMethods.getUsers, [], { enabled: isAuthenticated });

    // Filter and search users
    const filteredUsers = usersData?.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && (user.phoneVerified || user.emailVerified)) ||
            (filterStatus === 'verified' && user.phoneVerified && user.emailVerified) ||
            (filterStatus === 'phone-verified' && user.phoneVerified && !user.emailVerified) ||
            (filterStatus === 'email-verified' && user.emailVerified && !user.phoneVerified) ||
            (filterStatus === 'inactive' && !user.phoneVerified && !user.emailVerified);

        return matchesSearch && matchesFilter;
    }) || [];

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleUserSelect = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === sortedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(sortedUsers.map(user => user._id));
        }
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setShowUserModal(true);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser && selectedUser._id) {
                // Update existing user
                await apiMethods.updateUser(selectedUser._id, userData);
                toast.success('User updated successfully');
            } else {
                // Create new user using admin endpoint
                await apiMethods.createAdmin({
                    name: userData.name,
                    email: userData.email || `user${Date.now()}@example.com`,
                    password: userData.password || 'TempPassword123!'
                });
                toast.success('User created successfully');
            }
            refetchUsers();
            setShowUserModal(false);
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(selectedUser ? 'Failed to update user' : 'Failed to create user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await apiMethods.deleteUser(userId);
                toast.success('User deleted successfully');
                refetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const getStatusBadge = (user) => {
        const phoneVerified = user.phoneVerified || false;
        const emailVerified = user.emailVerified || false;
        
        if (phoneVerified && emailVerified) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Phone ✓
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Email ✓
                    </span>
                </div>
            );
        } else if (phoneVerified) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Phone ✓
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Email ✗
                    </span>
                </div>
            );
        } else if (emailVerified) {
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Phone ✗
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Email ✓
                    </span>
                </div>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Unverified
                </span>
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                        <p className="text-sm text-gray-500">
                            Manage user accounts and subscriptions
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setSelectedUser(null);
                        setShowUserModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
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
                        <option value="all">All Users</option>
                        <option value="verified">Fully Verified (Phone + Email)</option>
                        <option value="active">Partially Verified</option>
                        <option value="phone-verified">Phone Verified Only</option>
                        <option value="email-verified">Email Verified Only</option>
                        <option value="inactive">Unverified</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date Created</option>
                        <option value="name">Name</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
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

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {usersLoading ? (
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
                                    checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedUsers.length} selected
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {sortedUsers.map((user) => (
                                <div key={user._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user._id)}
                                            onChange={() => handleUserSelect(user._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-4">
                                            {/* User Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.phone}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Mail className="h-4 w-4 mr-2" />
                                                {user.email || 'No email'}
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center">
                                                {getStatusBadge(user)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-600 hover:text-red-900"
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
                        {sortedUsers.length === 0 && (
                            <div className="text-center py-12">
                                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterStatus !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'Get started by adding a new user.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <UserDetails
                    user={selectedUser}
                    onClose={() => setShowUserModal(false)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

export default Users;
