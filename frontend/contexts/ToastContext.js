/**
 * Global Toast Context
 * Provides toast notifications across the entire application
 */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op function instead of throwing an error
        // This prevents SSR issues and allows components to work without the provider
        return {
            showSuccess: () => { },
            showError: () => { },
            showInfo: () => { },
            showWarning: () => { }
        };
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        // Auto-remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Convenience methods
    const showSuccess = useCallback((message, duration) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    const showError = useCallback((message, duration) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    const showWarning = useCallback((message, duration) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    const showInfo = useCallback((message, duration) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    const value = {
        toasts,
        showToast,
        removeToast,
        clearToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
}

function Toast({ toast, onRemove }) {
    const { id, message, type } = toast;

    return (
        <div
            className={`toast toast-${type}`}
            onClick={() => onRemove(id)}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-content">
                <span className="toast-message">{message}</span>
                <button
                    className="toast-close"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
