// Utility functions for formatting data
import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

// Format currency
export const formatCurrency = (amount, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

// Format number with commas
export const formatNumber = (number) => {
    return new Intl.NumberFormat('en-KE').format(number);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
export const formatDate = (date, formatStr = 'PPP') => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, formatStr);
    } catch (error) {
        return '-';
    }
};

// Format relative time
export const formatRelativeTime = (date) => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatRelative(dateObj, new Date());
    } catch (error) {
        return '-';
    }
};

// Format distance time
export const formatDistanceTime = (date) => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatDistance(dateObj, new Date(), { addSuffix: true });
    } catch (error) {
        return '-';
    }
};

// Format duration
export const formatDuration = (seconds) => {
    if (!seconds) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

// Format MAC address
export const formatMacAddress = (mac) => {
    if (!mac) return '-';

    // Remove any non-hex characters and convert to uppercase
    const cleanMac = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

    if (cleanMac.length !== 12) return mac;

    // Format as XX:XX:XX:XX:XX:XX
    return cleanMac.match(/.{2}/g).join(':');
};

// Format IP address
export const formatIpAddress = (ip) => {
    if (!ip) return '-';
    return ip;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
    if (!phone) return '-';

    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Format as +254 XXX XXX XXX
    if (cleanPhone.length === 12 && cleanPhone.startsWith('254')) {
        return `+${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 9)} ${cleanPhone.slice(9)}`;
    }

    return phone;
};

// Format status
export const formatStatus = (status) => {
    if (!status) return '-';

    const statusMap = {
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
        expired: 'Expired',
        suspended: 'Suspended',
        cancelled: 'Cancelled',
        success: 'Success',
        failed: 'Failed',
        processing: 'Processing',
    };

    return statusMap[status.toLowerCase()] || status;
};

// Format role
export const formatRole = (role) => {
    if (!role) return '-';

    const roleMap = {
        admin: 'Administrator',
        operator: 'Operator',
        viewer: 'Viewer',
    };

    return roleMap[role.toLowerCase()] || role;
};

// Format package type
export const formatPackageType = (type) => {
    if (!type) return '-';

    const typeMap = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        unlimited: 'Unlimited',
    };

    return typeMap[type.toLowerCase()] || type;
};

// Format data usage
export const formatDataUsage = (bytes) => {
    if (!bytes) return '0 MB';

    const mb = bytes / (1024 * 1024);

    if (mb < 1024) {
        return `${mb.toFixed(2)} MB`;
    } else {
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
    }
};

// Format speed
export const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 KB/s';

    const kbps = bytesPerSecond / 1024;

    if (kbps < 1024) {
        return `${kbps.toFixed(2)} KB/s`;
    } else {
        const mbps = kbps / 1024;
        return `${mbps.toFixed(2)} MB/s`;
    }
};

export default {
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatFileSize,
    formatDate,
    formatRelativeTime,
    formatDistanceTime,
    formatDuration,
    formatMacAddress,
    formatIpAddress,
    formatPhoneNumber,
    formatStatus,
    formatRole,
    formatPackageType,
    formatDataUsage,
    formatSpeed,
};
