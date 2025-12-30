/**
 * Authentication Modal Component
 * Shows login/register options for unauthenticated users
 */

import { useState } from 'react';
import Link from 'next/link';

export default function AuthModal({
    isOpen,
    onClose,
    title = "Sign In Required",
    message = "Please sign in or create an account to continue.",
    redirectPath = "/"
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" style={{ zIndex: 1000 }}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <h3 style={{ color: 'var(--brand-2)', marginBottom: 16 }}>{title}</h3>

                <p style={{ marginBottom: 24, lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <Link
                        href={`/auth/login?redirect=${encodeURIComponent(redirectPath)}`}
                        className="btn"
                        style={{ flex: 1 }}
                    >
                        Sign In
                    </Link>
                    <Link
                        href={`/auth/register?redirect=${encodeURIComponent(redirectPath)}`}
                        className="btn ghost"
                        style={{ flex: 1 }}
                    >
                        Sign Up
                    </Link>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button
                        className="btn ghost"
                        onClick={onClose}
                        style={{ padding: '8px 16px' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}






















