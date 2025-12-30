/**
 * Protected Route Component
 * Wraps pages that require authentication
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, redirectTo = '/auth/login' }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Store the current URL to redirect back after login
            const currentPath = router.asPath;
            if (currentPath !== redirectTo) {
                sessionStorage.setItem('eco.redirectAfterLogin', currentPath);
            }
            router.push(redirectTo);
        }
    }, [isAuthenticated, loading, router, redirectTo]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid var(--brand-1)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <div className="kv">Checking authentication...</div>
                </div>
                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // If not authenticated, don't render children (redirect will happen)
    if (!isAuthenticated) {
        return null;
    }

    // If authenticated, render children
    return children;
}






















