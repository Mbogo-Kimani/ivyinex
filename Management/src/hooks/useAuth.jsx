// Authentication hook for Eco Wifi Management System
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import authService from '../services/auth';

// Create Auth Context
const AuthContext = createContext();

// Hook to use auth context
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

// Main authentication hook
export const useAuth = () => {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            // Only update state if values have actually changed
            setIsAuthenticated(prev => prev !== isAuth ? isAuth : prev);
            setUser(prev => prev !== currentUser ? currentUser : prev);

            // Check if token is expired
            if (isAuth && authService.isTokenExpired()) {
                // Clear auth state directly instead of calling handleLogout
                setUser(null);
                setIsAuthenticated(false);
                setError(null);
            }
        };

        checkAuth();
    }, []);

    // Login function
    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(credentials);

            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                setError(result.error);
                return { success: false, error: result.error };
            }
        } catch (err) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        setLoading(true);

        try {
            await authService.logout();
            // Clear all localStorage items related to auth
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            // Clear state
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
            // Redirect to login page
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout error:', err);
            // Even if logout fails, clear state and redirect
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
            window.location.href = '/login';
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle logout (internal)
    const handleLogout = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
    }, []);

    // Check permissions
    const hasPermission = useCallback((permission) => {
        return authService.hasPermission(permission);
    }, []);

    // Check role
    const hasRole = useCallback((role) => {
        return authService.hasRole(role);
    }, []);

    // Get user permissions
    const getUserPermissions = useCallback(() => {
        return authService.getUserPermissions();
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        hasPermission,
        hasRole,
        getUserPermissions,
        clearError,
    };
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
    const auth = useAuth();
    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

export default useAuth;
