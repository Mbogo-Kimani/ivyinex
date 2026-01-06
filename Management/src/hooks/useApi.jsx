// API hook for Eco Wifi Management System
import { useState, useEffect, useCallback } from 'react';
import { apiMethods } from '../services/api';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Generic API call wrapper
    const apiCall = useCallback(async (apiFunction, ...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...args);
            return { success: true, data: result };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'API call failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        apiCall,
        clearError,
    };
};

// Hook for data fetching with caching
export const useData = (apiFunction, dependencies = [], options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { enabled = true } = options;

    const fetchData = useCallback(async () => {
        // Check if hook is enabled and user is authenticated
        if (!enabled) {
            setLoading(false);
            return;
        }

        // Check authentication before making API call
        const token = localStorage.getItem('admin_token');
        if (!token) {
            setLoading(false);
            setError('Authentication required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction();
            setData(result);
        } catch (err) {
            // Handle 403 and 401 errors gracefully
            if (err.response?.status === 403 || err.response?.status === 401) {
                // Clear invalid token
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                setError('Authentication required. Please login again.');
            } else {
                const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to fetch data';
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [...dependencies, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};

// Hook for paginated data
export const usePaginatedData = (apiFunction, initialParams = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });
    const [params, setParams] = useState(initialParams);

    const fetchData = useCallback(async (newParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = {
                ...params,
                ...newParams,
                page: newParams.page || pagination.page,
                limit: newParams.limit || pagination.limit,
            };

            const result = await apiFunction(queryParams);

            setData(result.data || result);
            setPagination({
                page: result.page || pagination.page,
                limit: result.limit || pagination.limit,
                total: result.total || 0,
                pages: result.pages || 0,
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [apiFunction, params, pagination.page, pagination.limit]);

    const updateParams = useCallback((newParams) => {
        setParams(prev => ({ ...prev, ...newParams }));
    }, []);

    const goToPage = useCallback((page) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    const changeLimit = useCallback((limit) => {
        setPagination(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        pagination,
        fetchData,
        updateParams,
        goToPage,
        changeLimit,
    };
};

export default useApi;
