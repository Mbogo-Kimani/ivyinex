// VoucherForm component for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    X,
    Gift,
    DollarSign,
    Clock,
    Calendar,
    Save,
    AlertCircle,
    CheckCircle,
    Info,
    Package,
    Users,
    RefreshCw
} from 'lucide-react';

const VoucherForm = ({ voucher, mode, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        packageKey: '',
        value: 0,
        type: 'single',
        active: true,
        expiresAt: '',
        notes: '',
        maxUses: 1,
        usedCount: 0,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (voucher && mode === 'edit') {
            setFormData({
                code: voucher.code || '',
                packageKey: voucher.packageKey || '',
                value: voucher.valueKES || voucher.value || 0,
                type: voucher.type || 'single',
                active: voucher.active !== undefined ? voucher.active : true,
                expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toISOString().slice(0, 16) : '',
                notes: voucher.notes || '',
                maxUses: voucher.maxUses || voucher.uses || 1,
                usedCount: voucher.usedCount || 0,
            });
        } else {
            // Generate a random code for new vouchers
            generateRandomCode();
        }
    }, [voucher, mode]);

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({
            ...prev,
            code: result
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Voucher code is required';
        }

        if (!formData.packageKey.trim()) {
            newErrors.packageKey = 'Package key is required';
        }

        if (formData.value < 0) {
            newErrors.value = 'Value must be positive';
        }

        if (formData.maxUses < 1) {
            newErrors.maxUses = 'Max uses must be at least 1';
        }

        if (formData.type === 'bulk' && formData.maxUses < 2) {
            newErrors.maxUses = 'Bulk vouchers must allow multiple uses';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error saving voucher:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'single':
                return <Gift className="h-5 w-5 text-blue-600" />;
            case 'bulk':
                return <Users className="h-5 w-5 text-purple-600" />;
            default:
                return <Gift className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        {getTypeIcon(formData.type)}
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                                {mode === 'create' ? 'Create New Voucher' : 'Edit Voucher'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {mode === 'create' ? 'Generate a new voucher code' : 'Update voucher details'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Voucher Code *
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className={`flex-1 mt-1 block px-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.code ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                placeholder="Enter voucher code"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateRandomCode}
                                                className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                                                title="Generate random code"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {errors.code && (
                                            <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Package Key *
                                        </label>
                                        <input
                                            type="text"
                                            name="packageKey"
                                            value={formData.packageKey}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.packageKey ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter package key"
                                        />
                                        {errors.packageKey && (
                                            <p className="mt-1 text-sm text-red-600">{errors.packageKey}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Value (KES)
                                        </label>
                                        <input
                                            type="number"
                                            name="value"
                                            value={formData.value}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.value ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="0.00"
                                        />
                                        {errors.value && (
                                            <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Voucher Type
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="single">Single Use</option>
                                            <option value="bulk">Bulk Use</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Max Uses
                                        </label>
                                        <input
                                            type="number"
                                            name="maxUses"
                                            value={formData.maxUses}
                                            onChange={handleInputChange}
                                            min="1"
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.maxUses ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="1"
                                        />
                                        {errors.maxUses && (
                                            <p className="mt-1 text-sm text-red-600">{errors.maxUses}</p>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Number of times this voucher can be used
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Active Voucher
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Expiry Settings */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Expiry Settings</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Expires At
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="expiresAt"
                                            value={formData.expiresAt}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Leave empty for no expiry
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Additional Settings */}
                        <div className="space-y-6">
                            {/* Usage Information */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Usage Information</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Used Count
                                        </label>
                                        <input
                                            type="number"
                                            name="usedCount"
                                            value={formData.usedCount}
                                            onChange={handleInputChange}
                                            min="0"
                                            max={formData.maxUses}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Number of times this voucher has been used
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Remaining Uses</span>
                                            <span className="font-medium text-gray-900">
                                                {formData.maxUses - formData.usedCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Notes</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Add any additional notes about this voucher..."
                                    />
                                </div>
                            </div>

                            {/* Type Information */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Type Information</h4>
                                <div className="space-y-3">
                                    {formData.type === 'single' && (
                                        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                            <Gift className="h-5 w-5 text-blue-600 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-blue-900">Single Use Voucher</div>
                                                <div className="text-sm text-blue-700">Can be used only once</div>
                                            </div>
                                        </div>
                                    )}
                                    {formData.type === 'bulk' && (
                                        <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                                            <Users className="h-5 w-5 text-purple-600 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-purple-900">Bulk Use Voucher</div>
                                                <div className="text-sm text-purple-700">Can be used multiple times</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {mode === 'create' ? 'Create Voucher' : 'Update Voucher'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VoucherForm;
