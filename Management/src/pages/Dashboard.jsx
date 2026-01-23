// Dashboard page for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    Users,
    Smartphone,
    CreditCard,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import RevenueChart from '../components/Dashboard/RevenueChart';
import UserChart from '../components/Dashboard/UserChart';
import DeviceChart from '../components/Dashboard/DeviceChart';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalDevices: 0,
        activeDevices: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalVisits: 0,
    });

    const [systemHealth, setSystemHealth] = useState({
        status: 'unknown',
        mikrotik: 'unknown',
        database: 'unknown',
        lastUpdate: null,
    });

    // Get authentication status
    const { isAuthenticated } = useAuth();

    // Fetch dashboard data only if authenticated
    const { data: paymentsData, loading: paymentsLoading } = useData(apiMethods.getPayments, [], { enabled: isAuthenticated });
    const { data: subscriptionsData, loading: subscriptionsLoading } = useData(apiMethods.getSubscriptions, [], { enabled: isAuthenticated });
    const { data: devicesData, loading: devicesLoading } = useData(apiMethods.getDevices, [], { enabled: isAuthenticated });
    const { data: systemHealthData, loading: systemLoading } = useData(apiMethods.getSystemHealth, [], { enabled: isAuthenticated });
    const { data: visitData, loading: visitsLoading } = useData(apiMethods.getVisitAnalytics, [], { enabled: isAuthenticated });

    useEffect(() => {
        if (paymentsData) {
            const totalRevenue = paymentsData.reduce((sum, payment) => sum + (payment.amountKES || 0), 0);
            const monthlyRevenue = paymentsData
                .filter(payment => {
                    const paymentDate = new Date(payment.createdAt);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, payment) => sum + (payment.amountKES || 0), 0);

            setStats(prev => ({
                ...prev,
                totalRevenue,
                monthlyRevenue,
            }));
        }
    }, [paymentsData]);

    useEffect(() => {
        if (subscriptionsData) {
            const totalSubscriptions = subscriptionsData.length;
            const activeSubscriptions = subscriptionsData.filter(sub => sub.active).length;

            setStats(prev => ({
                ...prev,
                totalSubscriptions,
                activeSubscriptions,
            }));
        }
    }, [subscriptionsData]);

    useEffect(() => {
        if (devicesData) {
            const totalDevices = devicesData.length;
            const activeDevices = devicesData.filter(device => device.lastSeen &&
                new Date(device.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length;

            setStats(prev => ({
                ...prev,
                totalDevices,
                activeDevices,
            }));
        }
    }, [devicesData]);

    useEffect(() => {
        if (systemHealthData) {
            setSystemHealth(prev => ({
                ...prev,
                status: systemHealthData.status || 'unknown',
                mikrotik: systemHealthData.mikrotik || 'unknown',
                database: systemHealthData.database || 'unknown',
                lastUpdate: systemHealthData.lastUpdate || new Date().toISOString(),
            }));
        }
    }, [systemHealthData]);

    useEffect(() => {
        if (visitData) {
            setStats(prev => ({
                ...prev,
                totalVisits: visitData.totalVisits || 0
            }));
        }
    }, [visitData]);

    const statCards = [
        {
            title: 'Total Subscriptions',
            value: formatNumber(stats.totalSubscriptions),
            change: '+12%',
            changeType: 'positive',
            icon: Users,
            color: 'blue',
            loading: subscriptionsLoading,
        },
        {
            title: 'Active Subscriptions',
            value: formatNumber(stats.activeSubscriptions),
            change: '+8%',
            changeType: 'positive',
            icon: Activity,
            color: 'green',
            loading: subscriptionsLoading,
        },
        {
            title: 'Total Devices',
            value: formatNumber(stats.totalDevices),
            change: '+15%',
            changeType: 'positive',
            icon: Smartphone,
            color: 'purple',
            loading: devicesLoading,
        },
        {
            title: 'Active Devices',
            value: formatNumber(stats.activeDevices),
            change: '+5%',
            changeType: 'positive',
            icon: Wifi,
            color: 'indigo',
            loading: devicesLoading,
        },
        {
            title: 'Total Revenue',
            value: formatCurrency(stats.totalRevenue),
            change: '+23%',
            changeType: 'positive',
            icon: DollarSign,
            color: 'green',
            loading: paymentsLoading,
        },
        {
            title: 'Monthly Revenue',
            value: formatCurrency(stats.monthlyRevenue),
            change: '+18%',
            changeType: 'positive',
            icon: TrendingUp,
            color: 'emerald',
            loading: paymentsLoading,
        },
        {
            title: 'Web Visits',
            value: formatNumber(stats.totalVisits),
            change: '',
            changeType: 'neutral',
            icon: Users,
            color: 'orange',
            loading: visitsLoading,
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-100';
            case 'warning':
                return 'text-yellow-600 bg-yellow-100';
            case 'critical':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <Wifi className="h-4 w-4" />;
            case 'warning':
                return <WifiOff className="h-4 w-4" />;
            case 'critical':
                return <WifiOff className="h-4 w-4" />;
            default:
                return <WifiOff className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Overview of your Eco Wifi hotspot system
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Icon className={`h-6 w-6 text-${card.color}-600`} />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {card.title}
                                            </dt>
                                            <dd className="flex items-baseline">
                                                {card.loading ? (
                                                    <div className="animate-pulse">
                                                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-2xl font-semibold text-gray-900">
                                                            {card.value}
                                                        </div>
                                                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {card.changeType === 'positive' ? (
                                                                <TrendingUp className="h-4 w-4" />
                                                            ) : (
                                                                <TrendingDown className="h-4 w-4" />
                                                            )}
                                                            <span className="ml-1">{card.change}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* System health */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        System Health
                    </h3>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 p-2 rounded-full ${getStatusColor(systemHealth.status)}`}>
                                {getStatusIcon(systemHealth.status)}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Overall Status</p>
                                <p className="text-sm text-gray-500 capitalize">{systemHealth.status}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 p-2 rounded-full ${getStatusColor(systemHealth.mikrotik)}`}>
                                {getStatusIcon(systemHealth.mikrotik)}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">MikroTik Router</p>
                                <p className="text-sm text-gray-500 capitalize">{systemHealth.mikrotik}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 p-2 rounded-full ${getStatusColor(systemHealth.database)}`}>
                                {getStatusIcon(systemHealth.database)}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Database</p>
                                <p className="text-sm text-gray-500 capitalize">{systemHealth.database}</p>
                            </div>
                        </div>
                    </div>
                    {systemHealth.lastUpdate && (
                        <div className="mt-4 text-sm text-gray-500">
                            Last updated: {formatDate(systemHealth.lastUpdate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RevenueChart
                    data={paymentsData?.slice(0, 7).map((payment, index) => ({
                        date: formatDate(payment.createdAt),
                        amount: payment.amountKES
                    }))}
                    loading={paymentsLoading}
                />
                <UserChart
                    data={subscriptionsData?.slice(0, 7).map((subscription, index) => ({
                        date: formatDate(subscription.startAt),
                        newUsers: 1,
                        activeUsers: subscription.active ? 1 : 0
                    }))}
                    loading={subscriptionsLoading}
                />
            </div>

            {/* Device Analytics */}
            <DeviceChart
                data={devicesData?.slice(0, 7).map((device, index) => ({
                    date: formatDate(device.createdAt),
                    totalDevices: 1,
                    activeDevices: device.lastSeen && new Date(device.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 1 : 0
                }))}
                loading={devicesLoading}
            />

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Payments */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Payments
                        </h3>
                        <div className="mt-5">
                            {paymentsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : paymentsData && paymentsData.length > 0 ? (
                                <div className="space-y-3">
                                    {paymentsData.slice(0, 5).map((payment, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {payment.provider || 'M-Pesa'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(payment.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(payment.amountKES)}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {payment.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No recent payments</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Subscriptions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Subscriptions
                        </h3>
                        <div className="mt-5">
                            {subscriptionsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : subscriptionsData && subscriptionsData.length > 0 ? (
                                <div className="space-y-3">
                                    {subscriptionsData.slice(0, 5).map((subscription, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {subscription.packageKey || 'Unknown Package'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(subscription.startAt)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs px-2 py-1 rounded-full ${subscription.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {subscription.active ? 'Active' : 'Expired'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(subscription.endAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No recent subscriptions</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Quick Actions
                    </h3>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Create Voucher
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Add Package
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            View Reports
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            System Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
