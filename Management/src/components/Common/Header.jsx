// Header component for Eco Wifi Management System
import { useState } from 'react';
import {
    Menu,
    Bell,
    Search,
    User,
    LogOut,
    Settings,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import config from '../../config/env';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { connected } = useWebSocket();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = async () => {
        await logout();
        setShowUserMenu(false);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Left side */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Search */}
                        <div className="hidden sm:block ml-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* WebSocket status */}
                        {config.WS_ENABLED && (
                            <div className="flex items-center space-x-2">
                                {connected ? (
                                    <div className="flex items-center text-green-600">
                                        <Wifi className="h-4 w-4" />
                                        <span className="text-xs font-medium">Connected</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-red-600">
                                        <WifiOff className="h-4 w-4" />
                                        <span className="text-xs font-medium">Disconnected</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                            </button>

                            {/* Notifications dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                            Notifications
                                        </div>
                                        <div className="px-4 py-3 text-sm text-gray-500">
                                            No new notifications
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:bg-gray-100"
                            >
                                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {user?.name || 'Admin'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.role || 'Administrator'}
                                    </div>
                                </div>
                            </button>

                            {/* User dropdown */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                            {user?.email || 'admin@ecowifi.com'}
                                        </div>
                                        <button
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Settings className="h-4 w-4 mr-3" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
