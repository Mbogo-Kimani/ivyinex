import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect page for old reset-password URLs
 * Redirects to /auth/reset-password to maintain backward compatibility
 */
export default function ResetPasswordRedirect() {
    const router = useRouter();
    const { token } = router.query;

    useEffect(() => {
        if (token) {
            // Redirect to the correct route with the token
            router.replace(`/auth/reset-password?token=${token}`);
        } else {
            // If no token, redirect to forgot password page
            router.replace('/auth/forgot-password');
        }
    }, [token, router]);

    // Show loading state while redirecting
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(180deg, #081425 0%, #1C3D50 100%)' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
                <p>Redirecting...</p>
            </div>
        </div>
    );
}

