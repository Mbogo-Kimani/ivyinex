// Logs page for Eco Wifi Management System
import { useState } from 'react';
import {
    FileText,
    Search,
    Filter,
    Download,
    RefreshCw,
    AlertCircle,
    Info,
    AlertTriangle,
    XCircle,
    CheckCircle,
    Clock,
    Calendar,
    Trash2
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Logs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedLogs, setSelectedLogs] = useState([]);

    // Get authentication status
    const { isAuthenticated } = useAuth();

    // Fetch logs data only if authenticated
    const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useData(
        () => apiMethods.getLogs({ q: searchTerm }),
        [searchTerm],
        { enabled: isAuthenticated }
    );

    // Filter and search logs
    const filteredLogs = logsData?.filter(log => {
        const matchesSearch = log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log._id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLevelFilter = filterLevel === 'all' || log.level === filterLevel;
        const matchesSourceFilter = filterSource === 'all' || log.source === filterSource;

        return matchesSearch && matchesLevelFilter && matchesSourceFilter;
    }) || [];

    // Sort logs
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleLogSelect = (logId) => {
        setSelectedLogs(prev =>
            prev.includes(logId)
                ? prev.filter(id => id !== logId)
                : [...prev, logId]
        );
    };

    const handleSelectAll = () => {
        if (selectedLogs.length === sortedLogs.length) {
            setSelectedLogs([]);
        } else {
            setSelectedLogs(sortedLogs.map(log => log._id));
        }
    };

    const handleClearOldLogs = async () => {
        if (window.confirm('Are you sure you want to clear logs older than 30 days?')) {
            try {
                await apiMethods.performSystemAction('clear-old-logs', { days: 30 });
                toast.success('Old logs cleared successfully');
                refetchLogs();
            } catch (error) {
                toast.error('Failed to clear old logs');
            }
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'warn':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'info':
                return <Info className="h-4 w-4 text-blue-600" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getLevelBadge = (level) => {
        switch (level) {
            case 'error':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Error
                    </span>
                );
            case 'warn':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Warning
                    </span>
                );
            case 'info':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Info className="w-3 h-3 mr-1" />
                        Info
                    </span>
                );
            case 'success':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
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

    // Get unique levels and sources for filters
    const uniqueLevels = [...new Set(logsData?.map(log => log.level).filter(Boolean))] || [];
    const uniqueSources = [...new Set(logsData?.map(log => log.source).filter(Boolean))] || [];

    const handleExport = () => {
        if (!logsData || logsData.length === 0) {
            toast.error('No logs to export');
            return;
        }

        // Convert logs to CSV format
        const headers = ['id', 'level', 'source', 'message', 'metadata', 'createdAt'];
        const csvRows = [
            headers.join(','),
            ...logsData.map(log => [
                `"${log._id || ''}"`,
                `"${log.level || ''}"`,
                `"${log.source || ''}"`,
                `"${(log.message || '').replace(/"/g, '""')}"`, // Escape quotes in message
                log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
                log.createdAt ? `"${new Date(log.createdAt).toISOString()}"` : ''
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Logs exported successfully');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
                        <p className="text-sm text-gray-500">
                            View system logs and activity history
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleClearOldLogs}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Old Logs
                    </button>
                    <button
                        onClick={() => refetchLogs()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={!logsData || logsData.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
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
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                    </div>

                    {/* Level Filter */}
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Levels</option>
                        {uniqueLevels.map(level => (
                            <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                        ))}
                    </select>

                    {/* Source Filter */}
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Sources</option>
                        {uniqueSources.map(source => (
                            <option key={source} value={source}>{source}</option>
                        ))}
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="createdAt">Date</option>
                        <option value="level">Level</option>
                        <option value="source">Source</option>
                        <option value="message">Message</option>
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

            {/* Logs Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {logsLoading ? (
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
                                    checked={selectedLogs.length === sortedLogs.length && sortedLogs.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-500">
                                    {selectedLogs.length} selected
                                </span>
                                <span className="ml-4 text-sm text-gray-500">
                                    Total: {sortedLogs.length} logs
                                </span>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {sortedLogs.map((log) => (
                                <div key={log._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            checked={selectedLogs.includes(log._id)}
                                            onChange={() => handleLogSelect(log._id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                        />
                                        <div className="ml-4 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-5">
                                            {/* Level */}
                                            <div className="flex items-center">
                                                {getLevelIcon(log.level)}
                                                <div className="ml-2">
                                                    {getLevelBadge(log.level)}
                                                </div>
                                            </div>

                                            {/* Source */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className="font-medium">{log.source || 'Unknown'}</span>
                                            </div>

                                            {/* Message */}
                                            <div className="flex items-center text-sm text-gray-900 col-span-2">
                                                <span className="truncate">{log.message || 'No message'}</span>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                        <div className="ml-8 mt-2 text-xs text-gray-500">
                                            <details>
                                                <summary className="cursor-pointer hover:text-gray-700">View Metadata</summary>
                                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {sortedLogs.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterLevel !== 'all' || filterSource !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'No logs have been recorded yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Logs;
