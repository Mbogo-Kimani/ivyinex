// API service for Eco Wifi Management System
import axios from 'axios';
import config from '../config/env';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: config.API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Unauthorized or Forbidden - clear all auth data
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            sessionStorage.clear(); // Clear session storage as well

            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                // Use replace to prevent back button issues
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

// API endpoints
export const apiEndpoints = {
    // Authentication
    auth: {
        login: '/admin/auth/login',
        register: '/auth/register',
    },

    // Analytics
    analytics: {
        revenue: '/admin/analytics/revenue',
        users: '/admin/analytics/users',
        devices: '/admin/analytics/devices',
        packages: '/admin/analytics/packages',
    },

    // Users
    users: {
        list: '/admin/users',
        get: (id) => `/admin/users/${id}`,
        update: (id) => `/admin/users/${id}`,
        delete: (id) => `/admin/users/${id}`,
    },

    // Devices
    devices: {
        list: '/admin/devices',
        get: (mac) => `/admin/devices/${mac}`,
        update: (mac) => `/admin/devices/${mac}`,
    },

    // Subscriptions
    subscriptions: {
        list: '/admin/subscriptions',
        get: (id) => `/admin/subscriptions/${id}`,
        update: (id) => `/admin/subscriptions/${id}`,
        delete: (id) => `/admin/subscriptions/${id}`,
    },

    // Packages
    packages: {
        list: '/admin/packages',
        create: '/admin/packages/create',
        bulkCreate: '/admin/packages/bulk-create',
        update: (id) => `/admin/packages/${id}`,
        delete: (id) => `/admin/packages/${id}`,
    },

    // Vouchers
    vouchers: {
        list: '/admin/vouchers',
        create: '/admin/vouchers/create',
        update: (id) => `/admin/vouchers/${id}`,
        delete: (id) => `/admin/vouchers/${id}`,
    },

    // Payments
    payments: {
        list: '/admin/payments',
        get: (id) => `/admin/payments/${id}`,
    },

    // System
    system: {
        health: '/admin/health',
        stats: '/admin/stats',
        actions: '/admin/actions',
    },

    // Admins
    admins: {
        list: '/admin/admins',
        changePassword: (id) => `/admin/admins/${id}/password`,
    },

    // Logs
    logs: {
        list: '/admin/logs',
        get: (id) => `/admin/logs/${id}`,
    },
};

// API methods
export const apiMethods = {
    // Authentication
    login: async (credentials) => {
        const response = await api.post(apiEndpoints.auth.login, credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post(apiEndpoints.auth.register, userData);
        return response.data;
    },

    createAdmin: async (adminData) => {
        const response = await api.post('/admin/auth/create-admin', adminData);
        return response.data;
    },

    // Analytics
    getRevenueAnalytics: async (params = {}) => {
        const response = await api.get(apiEndpoints.analytics.revenue, { params });
        return response.data;
    },

    getUserAnalytics: async (params = {}) => {
        const response = await api.get(apiEndpoints.analytics.users, { params });
        return response.data;
    },

    getDeviceAnalytics: async (params = {}) => {
        const response = await api.get(apiEndpoints.analytics.devices, { params });
        return response.data;
    },

    getPackageAnalytics: async (params = {}) => {
        const response = await api.get(apiEndpoints.analytics.packages, { params });
        return response.data;
    },

    // Users
    getUsers: async (params = {}) => {
        const response = await api.get(apiEndpoints.users.list, { params });
        return response.data;
    },

    getUser: async (id) => {
        const response = await api.get(apiEndpoints.users.get(id));
        return response.data;
    },

    updateUser: async (id, data) => {
        const response = await api.put(apiEndpoints.users.update(id), data);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(apiEndpoints.users.delete(id));
        return response.data;
    },

    // Devices
    getDevices: async (params = {}) => {
        const response = await api.get(apiEndpoints.devices.list, { params });
        return response.data;
    },

    getDevice: async (mac) => {
        const response = await api.get(apiEndpoints.devices.get(mac));
        return response.data;
    },

    updateDevice: async (mac, data) => {
        const response = await api.put(apiEndpoints.devices.update(mac), data);
        return response.data;
    },

    // Subscriptions
    getSubscriptions: async (params = {}) => {
        const response = await api.get(apiEndpoints.subscriptions.list, { params });
        return response.data;
    },

    getSubscription: async (id) => {
        const response = await api.get(apiEndpoints.subscriptions.get(id));
        return response.data;
    },

    updateSubscription: async (id, data) => {
        const response = await api.put(apiEndpoints.subscriptions.update(id), data);
        return response.data;
    },

    deleteSubscription: async (id) => {
        const response = await api.delete(apiEndpoints.subscriptions.delete(id));
        return response.data;
    },

    // Packages
    getPackages: async (params = {}) => {
        const response = await api.get(apiEndpoints.packages.list, { params });
        return response.data;
    },

    createPackage: async (data) => {
        const response = await api.post(apiEndpoints.packages.create, data);
        return response.data;
    },

    bulkCreatePackages: async (data) => {
        const response = await api.post(apiEndpoints.packages.bulkCreate, data);
        return response.data;
    },

    updatePackage: async (id, data) => {
        const response = await api.put(apiEndpoints.packages.update(id), data);
        return response.data;
    },

    deletePackage: async (id) => {
        const response = await api.delete(apiEndpoints.packages.delete(id));
        return response.data;
    },

    // Vouchers
    getVouchers: async (params = {}) => {
        const response = await api.get(apiEndpoints.vouchers.list, { params });
        return response.data;
    },

    createVoucher: async (data) => {
        const response = await api.post(apiEndpoints.vouchers.create, data);
        return response.data;
    },

    updateVoucher: async (id, data) => {
        const response = await api.put(apiEndpoints.vouchers.update(id), data);
        return response.data;
    },

    deleteVoucher: async (id) => {
        const response = await api.delete(apiEndpoints.vouchers.delete(id));
        return response.data;
    },

    // Payments
    getPayments: async (params = {}) => {
        const response = await api.get(apiEndpoints.payments.list, { params });
        return response.data;
    },

    getPayment: async (id) => {
        const response = await api.get(apiEndpoints.payments.get(id));
        return response.data;
    },

    // System
    getSystemHealth: async () => {
        const response = await api.get(apiEndpoints.system.health);
        return response.data;
    },

    getSystemStats: async () => {
        const response = await api.get(apiEndpoints.system.stats);
        return response.data;
    },

    performSystemAction: async (action, data = {}) => {
        const response = await api.post(apiEndpoints.system.actions, { action, ...data });
        return response.data;
    },

    // Logs
    getLogs: async (params = {}) => {
        const response = await api.get(apiEndpoints.logs.list, { params });
        return response.data;
    },

    getLog: async (id) => {
        const response = await api.get(apiEndpoints.logs.get(id));
        return response.data;
    },

    // Admins
    getAdmins: async () => {
        const response = await api.get(apiEndpoints.admins.list);
        return response.data;
    },

    changeAdminPassword: async (adminId, password) => {
        const response = await api.put(apiEndpoints.admins.changePassword(adminId), { password });
        return response.data;
    },

    // Ads
    getAds: async (params = {}) => {
        const response = await api.get('/ads/admin/list', { params });
        return response.data;
    },

    getAd: async (id) => {
        const response = await api.get(`/ads/${id}`);
        return response.data;
    },

    createAd: async (data) => {
        const response = await api.post('/ads/admin/create', data);
        return response.data;
    },

    updateAd: async (id, data) => {
        const response = await api.put(`/ads/admin/${id}`, data);
        return response.data;
    },

    deleteAd: async (id) => {
        const response = await api.delete(`/ads/admin/${id}`);
        return response.data;
    },

    getAdStats: async () => {
        const response = await api.get('/ads/admin/stats');
        return response.data;
    },

    // Broadcasts
    sendBroadcast: async (data) => {
        const response = await api.post('/admin/messages/broadcast', data);
        return response.data;
    },

    getBroadcasts: async () => {
        const response = await api.get('/admin/messages/broadcasts');
        return response.data;
    },

    // Analytics (Visits)
    getVisitAnalytics: async () => {
        const response = await api.get('/analytics/stats');
        return response.data;
    },
};


export default api;
