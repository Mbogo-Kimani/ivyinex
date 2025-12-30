// Constants for Eco Wifi Management System

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/admin/auth/login',
        LOGOUT: '/admin/auth/logout',
        REFRESH: '/admin/auth/refresh',
    },
    ANALYTICS: {
        REVENUE: '/admin/analytics/revenue',
        USERS: '/admin/analytics/users',
        DEVICES: '/admin/analytics/devices',
        PACKAGES: '/admin/analytics/packages',
    },
    USERS: '/admin/users',
    DEVICES: '/admin/devices',
    SUBSCRIPTIONS: '/admin/subscriptions',
    PACKAGES: '/admin/packages',
    VOUCHERS: '/admin/vouchers',
    PAYMENTS: '/admin/payments',
    LOGS: '/admin/logs',
    SYSTEM: {
        HEALTH: '/admin/system/health',
        STATS: '/admin/system/stats',
        ACTIONS: '/admin/system/actions',
    },
};

// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    OPERATOR: 'operator',
    VIEWER: 'viewer',
};

// User permissions
export const PERMISSIONS = {
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    USERS_DELETE: 'users.delete',
    DEVICES_READ: 'devices.read',
    DEVICES_WRITE: 'devices.write',
    SUBSCRIPTIONS_READ: 'subscriptions.read',
    SUBSCRIPTIONS_WRITE: 'subscriptions.write',
    SUBSCRIPTIONS_DELETE: 'subscriptions.delete',
    PACKAGES_READ: 'packages.read',
    PACKAGES_WRITE: 'packages.write',
    PACKAGES_DELETE: 'packages.delete',
    VOUCHERS_READ: 'vouchers.read',
    VOUCHERS_WRITE: 'vouchers.write',
    VOUCHERS_DELETE: 'vouchers.delete',
    PAYMENTS_READ: 'payments.read',
    LOGS_READ: 'logs.read',
    SETTINGS_READ: 'settings.read',
    SETTINGS_WRITE: 'settings.write',
    ADMIN: 'admin',
};

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended',
    CANCELLED: 'cancelled',
};

// Payment statuses
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};

// Package types
export const PACKAGE_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    UNLIMITED: 'unlimited',
};

// Log levels
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};

// Log sources
export const LOG_SOURCES = {
    AUTH: 'auth',
    USER: 'user',
    DEVICE: 'device',
    SUBSCRIPTION: 'subscription',
    PAYMENT: 'payment',
    PACKAGE: 'package',
    VOUCHER: 'voucher',
    SYSTEM: 'system',
    MIKROTIK: 'mikrotik',
};

// System health status
export const SYSTEM_HEALTH = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    OFFLINE: 'offline',
};

// Chart colors
export const CHART_COLORS = {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    SUCCESS: '#059669',
    WARNING: '#F59E0B',
    ERROR: '#DC2626',
    INFO: '#3B82F6',
    PURPLE: '#8B5CF6',
    PINK: '#EC4899',
    ORANGE: '#F97316',
    TEAL: '#14B8A6',
    INDIGO: '#6366F1',
};

// Table pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    LIMIT_OPTIONS: [10, 25, 50, 100],
};

// Date formats
export const DATE_FORMATS = {
    SHORT: 'MMM dd, yyyy',
    LONG: 'MMMM dd, yyyy',
    DATETIME: 'MMM dd, yyyy HH:mm',
    TIME: 'HH:mm',
    ISO: 'yyyy-MM-dd',
};

// File upload
export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
};

// WebSocket events
export const WS_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    USER_UPDATED: 'user_updated',
    SUBSCRIPTION_UPDATED: 'subscription_updated',
    DEVICE_UPDATED: 'device_updated',
    PAYMENT_UPDATED: 'payment_updated',
    SYSTEM_ALERT: 'system_alert',
    LOG_CREATED: 'log_created',
};

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

// Local storage keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'admin_token',
    USER_DATA: 'admin_user',
    THEME: 'theme',
    LANGUAGE: 'language',
    SETTINGS: 'settings',
};

// API response status
export const API_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
};

// Device status
export const DEVICE_STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    UNKNOWN: 'unknown',
};

// Voucher status
export const VOUCHER_STATUS = {
    ACTIVE: 'active',
    USED: 'used',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};

// System actions
export const SYSTEM_ACTIONS = {
    RESTART: 'restart',
    BACKUP: 'backup',
    CLEANUP: 'cleanup',
    SYNC: 'sync',
    TEST_CONNECTION: 'test_connection',
};

// Export all constants
export default {
    API_ENDPOINTS,
    USER_ROLES,
    PERMISSIONS,
    SUBSCRIPTION_STATUS,
    PAYMENT_STATUS,
    PACKAGE_TYPES,
    LOG_LEVELS,
    LOG_SOURCES,
    SYSTEM_HEALTH,
    CHART_COLORS,
    PAGINATION,
    DATE_FORMATS,
    FILE_UPLOAD,
    WS_EVENTS,
    NOTIFICATION_TYPES,
    STORAGE_KEYS,
    API_STATUS,
    DEVICE_STATUS,
    VOUCHER_STATUS,
    SYSTEM_ACTIONS,
};
