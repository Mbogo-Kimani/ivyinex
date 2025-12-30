// Authentication service for Eco Wifi Management System
import { apiMethods } from './api';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('admin_token');
        this.user = JSON.parse(localStorage.getItem('admin_user') || 'null');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Login user
    async login(credentials) {
        try {
            const response = await apiMethods.login(credentials);

            if (response.success && response.token) {
                this.token = response.token;
                this.user = response.user;

                // Store in localStorage
                localStorage.setItem('admin_token', this.token);
                localStorage.setItem('admin_user', JSON.stringify(this.user));

                return { success: true, user: this.user };
            }

            return { success: false, error: response.error || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    }

    // Logout user
    async logout() {
        // Clear local storage
        this.token = null;
        this.user = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    }

    // Refresh token
    async refreshToken() {
        try {
            const response = await apiMethods.refresh();

            if (response.success && response.token) {
                this.token = response.token;
                localStorage.setItem('admin_token', this.token);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }

    // Check if token is expired
    isTokenExpired() {
        if (!this.token) return true;

        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    // Get user permissions
    getUserPermissions() {
        // For admin users, return all permissions
        if (this.user?.role === 'admin') {
            return ['admin', 'users.read', 'users.write', 'devices.read', 'devices.write',
                'subscriptions.read', 'subscriptions.write', 'packages.read', 'packages.write',
                'vouchers.read', 'vouchers.write', 'payments.read', 'payments.write',
                'logs.read', 'settings.read', 'settings.write'];
        }
        return this.user?.permissions || [];
    }

    // Check if user has permission
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission) || permissions.includes('admin');
    }

    // Check if user has role
    hasRole(role) {
        return this.user?.role === role || this.user?.role === 'admin';
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
