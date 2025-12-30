// Settings page for Eco Wifi Management System
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500">Settings page coming soon...</p>
            </div>
        </div>
    );
};

export default Settings;
