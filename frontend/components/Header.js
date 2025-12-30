import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onOpenVoucher, portalData }) {
    const { user, isAuthenticated, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <header className="header container" role="banner" style={{ overflow: 'hidden' }}>
            <div className="brand">
                <div className="logo">Eco</div>
                <div>
                    <div className="site-title">Eco Wifi</div>
                    <div className="site-sub">Reliable community hotspot</div>
                </div>
            </div>

            {/* Desktop nav */}
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div className="hide-sm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href="/ads" className="btn ghost">Ads & Promos</Link>
                    {isAuthenticated ? (
                        <>
                            <Link href="/account/free-trial" className="btn ghost">Free Trial</Link>
                            <Link href="/account" className="btn ghost">My Account</Link>
                            <button className="btn ghost" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn ghost">Sign In</Link>
                            <Link href="/auth/register" className="btn">Sign Up</Link>
                        </>
                    )}

                </div>

                {/* Mobile hamburger */}
                <button
                    className="btn ghost show-sm"
                    aria-label="Toggle menu"
                    onClick={() => setMenuOpen(v => !v)}
                    style={{ padding: '8px 12px' }}
                >
                    <span className="menu-text">{menuOpen ? 'Close' : 'Menu'}</span>
                    <span className="hamburger-icon" style={{ display: 'none' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {menuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            )}
                        </svg>
                    </span>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <nav className="show-sm" style={{ marginTop: 12 }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <Link href="/ads" className="btn ghost" onClick={() => setMenuOpen(false)}>Ads & Promos</Link>
                        {isAuthenticated ? (
                            <>
                                <Link href="/account/free-trial" className="btn ghost" onClick={() => setMenuOpen(false)}>Free Trial</Link>
                                <Link href="/account" className="btn ghost" onClick={() => setMenuOpen(false)}>My Account</Link>
                                <button className="btn ghost" onClick={() => { setMenuOpen(false); logout(); }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="btn ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
                                <Link href="/auth/register" className="btn" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                            </>
                        )}

                    </div>
                </nav>
            )}
        </header>
    );
}
