import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PackageCard({ pkg, onBuy, onFreeTrial }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // Check if this is a free trial package
    const isFreeTrial = pkg.priceKES === 0 ||
        pkg.packageKey === 'free-trial' ||
        pkg.name?.toLowerCase().includes('free trial');

    const handleFreeTrialClick = () => {
        if (!isAuthenticated) {
            // Show login/register modal or redirect
            if (onFreeTrial) {
                onFreeTrial(pkg);
            }
        } else {
            // User is authenticated, proceed with free trial
            if (onFreeTrial) {
                onFreeTrial(pkg);
            }
        }
    };

    return (
        <div className="card" role="article" style={{
            border: isFreeTrial ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(47, 231, 245, 0.2)',
            background: isFreeTrial ? 'rgba(16, 185, 129, 0.1)' : 'var(--ivynex-panel)'
        }}>
            <div className="row space-between">
                <h3>{pkg.name}</h3>
                <div className="kv">{Math.round(pkg.durationSeconds / 3600)} hr</div>
            </div>

            <div className="price" style={{ color: isFreeTrial ? '#10b981' : 'var(--ivynex-primary)' }}>
                {isFreeTrial ? 'FREE' : `KES ${pkg.priceKES}`}
            </div>
            <div className="meta">
                {pkg.pointsRequired > 0 ? (
                    <>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                            {pkg.pointsRequired} points required
                        </span>
                        {pkg.pointsEarned > 0 && (
                            <span style={{ color: '#10b981', marginLeft: '8px' }}>
                                • Earn {pkg.pointsEarned} points
                            </span>
                        )}
                        <span> • {pkg.devicesAllowed} device(s)</span>
                    </>
                ) : isFreeTrial ? (
                    <span>{pkg.devicesAllowed} device(s)</span>
                ) : (
                    <>
                        <span>Speed: {Math.round(pkg.speedKbps / 1000 * 10) / 10} Mbps</span>
                        <span> • {pkg.devicesAllowed} device(s)</span>
                    </>
                )}
            </div>

            <div style={{ marginTop: 14 }} className="row">
                {isFreeTrial ? (
                    <button
                        className="btn"
                        onClick={handleFreeTrialClick}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        {isAuthenticated ? 'Get Free Trial' : 'Sign Up for Free Trial'}
                    </button>
                ) : (
                    <>
                        <button className="btn" onClick={() => onBuy(pkg)}>Use Voucher</button>
                        <button
                            className="btn ghost"
                            onClick={() => router.push(`/checkout?packageKey=${pkg.key}`)}
                        >
                            Buy (MPESA)
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
