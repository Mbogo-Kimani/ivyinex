// WebSocket hook for real-time updates
import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from './useAuth';
import config from '../config/env';

export const useWebSocket = () => {
    const { isAuthenticated } = useAuth();
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);

    // Connect to WebSocket when authenticated
    useEffect(() => {
        if (config.WS_ENABLED && isAuthenticated) {
            websocketService.connect();
        } else {
            websocketService.disconnect();
        }
    }, [isAuthenticated]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            websocketService.disconnect();
        };
    }, []);

    // Monitor connection status
    useEffect(() => {
        const handleConnect = () => {
            setConnected(true);
            setError(null);
        };

        const handleDisconnect = () => {
            setConnected(false);
        };

        const handleError = (error) => {
            setError(error);
            setConnected(false);
        };

        websocketService.on('connect', handleConnect);
        websocketService.on('disconnect', handleDisconnect);
        websocketService.on('connect_error', handleError);

        return () => {
            websocketService.off('connect', handleConnect);
            websocketService.off('disconnect', handleDisconnect);
            websocketService.off('connect_error', handleError);
        };
    }, []);

    return {
        connected,
        error,
        isConnected: websocketService.isConnected(),
    };
};

// Hook for real-time data updates
export const useRealtimeData = (dataType, callback) => {
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleUpdate = (data) => {
            if (callbackRef.current) {
                callbackRef.current(data);
            }
        };

        websocketService.subscribeToUpdates(dataType, handleUpdate);

        return () => {
            websocketService.unsubscribeFromUpdates(dataType, handleUpdate);
        };
    }, [dataType]);
};

// Hook for system alerts
export const useSystemAlerts = (callback) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleAlert = (alert) => {
            if (callbackRef.current) {
                callbackRef.current(alert);
            }
        };

        websocketService.on('system_alert', handleAlert);

        return () => {
            websocketService.off('system_alert', handleAlert);
        };
    }, []);
};

// Hook for log updates
export const useLogUpdates = (callback) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleLogUpdate = (log) => {
            if (callbackRef.current) {
                callbackRef.current(log);
            }
        };

        websocketService.on('log_created', handleLogUpdate);

        return () => {
            websocketService.off('log_created', handleLogUpdate);
        };
    }, []);
};

export default useWebSocket;
