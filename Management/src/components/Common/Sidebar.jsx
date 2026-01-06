// Sidebar component for Eco Wifi Management System
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Users,
    Smartphone,
    CreditCard,
    Package,
    Gift,
    DollarSign,
    FileText,
    Settings,
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [expandedItems, setExpandedItems] = useState({});

    const navigation = [
        {
            name: 'Dashboard',
            href: '/',
            icon: Home,
            current: location.pathname === '/',
        },
        {
            name: 'Users',
            href: '/users',
            icon: Users,
            current: location.pathname.startsWith('/users'),
            permission: 'users.read',
        },
        {
            name: 'Devices',
            href: '/devices',
            icon: Smartphone,
            current: location.pathname.startsWith('/devices'),
            permission: 'devices.read',
        },
        {
            name: 'Subscriptions',
            href: '/subscriptions',
            icon: CreditCard,
            current: location.pathname.startsWith('/subscriptions'),
            permission: 'subscriptions.read',
        },
        {
            name: 'Packages',
            href: '/packages',
            icon: Package,
            current: location.pathname.startsWith('/packages'),
            permission: 'packages.read',
        },
        {
            name: 'Vouchers',
            href: '/vouchers',
            icon: Gift,
            current: location.pathname.startsWith('/vouchers'),
            permission: 'vouchers.read',
        },
        {
            name: 'Payments',
            href: '/payments',
            icon: DollarSign,
            current: location.pathname.startsWith('/payments'),
            permission: 'payments.read',
        },
        {
            name: 'Logs',
            href: '/logs',
            icon: FileText,
            current: location.pathname.startsWith('/logs'),
            permission: 'logs.read',
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
            current: location.pathname.startsWith('/settings'),
            permission: 'settings.read',
        },
    ];

    const toggleExpanded = (itemName) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const filteredNavigation = navigation.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

    return (
        <>
            {/* Mobile sidebar overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={onClose}
                >
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                </div>
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex h-screen flex-col">
                    {/* Logo */}
                    <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">E</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-lg font-semibold text-gray-900">Eco Wifi</h1>
                                <p className="text-xs text-gray-500">Management</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={onClose}
                                    className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${item.current
                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <Icon
                                        className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-gray-200 p-4">
                        <div className="text-xs text-gray-500 text-center">
                            Eco Wifi Management v1.0.0
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
