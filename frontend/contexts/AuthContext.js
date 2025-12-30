/**
 * Authentication Context
 * Manages user authentication state and session
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useToast } from './ToastContext';
import * as api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        // Return default values instead of throwing an error
        // This prevents SSR issues and allows components to work without the provider
        return {
            user: null,
            isAuthenticated: false,
            loading: false,
            login: async () => ({ success: false, error: 'Not authenticated' }),
            register: async () => ({ success: false, error: 'Not authenticated' }),
            logout: () => { },
            updateUser: () => { }
        };
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const { showError, showSuccess } = useToast();

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('eco.authToken');
            if (token) {
                // Call /api/auth/me to check authentication status
                const response = await api.getCurrentUser();
                if (response.ok && response.user) {
                    setUser(response.user);
                    setIsAuthenticated(true);
                } else {
                    // Invalid token, clear session
                    logout();
                }
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            // Clear invalid session
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (credentials) => {
        try {
            setLoading(true);

            // Call login API
            const response = await api.login(credentials);

            if (response.ok && response.user && response.token) {
                // Store token (in production, use HttpOnly cookies)
                localStorage.setItem('eco.authToken', response.token);

                setUser(response.user);
                setIsAuthenticated(true);

                showSuccess('Login successful!');
                return { success: true, user: response.user };
            } else {
                // Handle specific error messages from backend with status
                let message = response.error || 'Login failed';
                if (response.status === 404) message = 'We could not find an account with that phone number';
                if (response.status === 401) message = 'Wrong password. Please try again.';
                showError(message);
                return { success: false, error: message };
            }

        } catch (err) {
            showError(err.message || 'Login failed');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [showError, showSuccess]);

    const register = useCallback(async (userData) => {
        try {
            setLoading(true);

            // Call registration API
            const response = await api.register(userData);

            if (response.ok && response.user && response.token) {
                // Store token (in production, use HttpOnly cookies)
                localStorage.setItem('eco.authToken', response.token);

                setUser(response.user);
                setIsAuthenticated(true);

                showSuccess('Registration successful!');
                return { success: true, user: response.user };
            } else {
                // Handle specific error messages from backend
                const errorMessage = response.error || 'Registration failed';
                showError(errorMessage);
                return { success: false, error: errorMessage };
            }

        } catch (err) {
            showError(err.message || 'Registration failed');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [showError, showSuccess]);

    const logout = useCallback(() => {
        // Clear token
        localStorage.removeItem('eco.authToken');

        // Clear user state
        setUser(null);
        setIsAuthenticated(false);

        // Redirect to login
        router.push('/auth/login');
    }, [router]);

    const updateUser = useCallback((updatedUser) => {
        setUser(prev => ({ ...prev, ...updatedUser }));
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
