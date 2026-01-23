// Environment configuration for Eco Wifi Management System
export const config = {
    API_URL: import.meta.env.VITE_API_URL || 'https://ivyinex.onrender.com/api',

    WS_URL: import.meta.env.VITE_WS_URL || 'wss://ivyinex.onrender.com',
    WS_ENABLED: import.meta.env.VITE_WS_ENABLED === 'true' || false,
    ADMIN_SECRET: import.meta.env.VITE_ADMIN_SECRET || 'your-admin-secret',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Eco Wifi Management',
    VERSION: import.meta.env.VITE_VERSION || '1.0.0',
    NODE_ENV: import.meta.env.NODE_ENV || 'development'
};

export default config;
