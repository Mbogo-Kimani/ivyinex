import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onOpenVoucher, portalData }) {
    const { user, isAuthenticated, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <header className="header container" role="banner" style={{ overflow: 'hidden' }}>
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <img src="/logo.png" alt="Wifi Mtaani Logo" style={{ height: 40, width: 'auto' }} />
                    <div className="hide-xs">
                        <div className="site-title" style={{ fontSize: 20, lineHeight: 1.2 }}>Wifi Mtaani</div>
                        <div className="site-sub" style={{ fontSize: 12 }}>Tap.Pay.Connect.</div>
                    </div>
                </Link>
            </div>

            {/* Desktop nav */}
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div className="hide-sm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href="/ads" className="btn ghost">Ads & Promos</Link>
                    {isAuthenticated ? (
                        <>
                            <Link href="/account/free-trial" className="btn ghost">Free Trial</Link>
                            <Link href="/messages" className="btn ghost">Messages</Link>
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
                    style={{ padding: '8px 12px', color: 'white' }}
                >
                    <span className="menu-text" style={{ color: 'white', fontWeight: 600 }}>{menuOpen ? 'Close' : 'Menu'}</span>
                    <span className="hamburger-icon" style={{ color: 'white' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                <Link href="/messages" className="btn ghost" onClick={() => setMenuOpen(false)}>Messages</Link>
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
