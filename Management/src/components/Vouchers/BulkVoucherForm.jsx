// BulkVoucherForm component for Eco Wifi Management System
import { useState } from 'react';
import {
    X,
    Users,
    Save,
    AlertCircle,
    CheckCircle,
    Info,
    Package,
    Gift,
    RefreshCw,
    Download,
    Copy
} from 'lucide-react';

const BulkVoucherForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        packageKey: '',
        value: 0,
        count: 10,
        prefix: 'VOUCHER',
        suffix: '',
        expiresAt: '',
        active: true,
        notes: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generatedCodes, setGeneratedCodes] = useState([]);

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

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const generateCodes = () => {
        const codes = [];
        for (let i = 0; i < formData.count; i++) {
            const randomCode = generateRandomCode();
            const code = `${formData.prefix}_${randomCode}${formData.suffix ? '_' + formData.suffix : ''}`;
            codes.push(code);
        }
        setGeneratedCodes(codes);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.packageKey.trim()) {
            newErrors.packageKey = 'Package key is required';
        }

        if (formData.value < 0) {
            newErrors.value = 'Value must be positive';
        }

        if (formData.count < 1 || formData.count > 1000) {
            newErrors.count = 'Count must be between 1 and 1000';
        }

        if (!formData.prefix.trim()) {
            newErrors.prefix = 'Prefix is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        if (generatedCodes.length === 0) {
            generateCodes();
        }

        setLoading(true);
        try {
            const bulkData = {
                ...formData,
                codes: generatedCodes,
                type: 'bulk'
            };
            await onSave(bulkData);
        } catch (error) {
            console.error('Error creating bulk vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCodesToClipboard = () => {
        const codesText = generatedCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        // You could add a toast notification here
    };

    const downloadCodes = () => {
        const codesText = generatedCodes.join('\n');
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voucher_codes_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Bulk Create Vouchers
                            </h3>
                            <p className="text-sm text-gray-500">
                                Generate multiple voucher codes at once
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
                        {/* Left Column - Configuration */}
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Voucher Configuration</h4>
                                <div className="space-y-4">
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
                                            Number of Vouchers *
                                        </label>
                                        <input
                                            type="number"
                                            name="count"
                                            value={formData.count}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="1000"
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.count ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="10"
                                        />
                                        {errors.count && (
                                            <p className="mt-1 text-sm text-red-600">{errors.count}</p>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Maximum 1000 vouchers per batch
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Code Generation */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Code Generation</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Prefix *
                                        </label>
                                        <input
                                            type="text"
                                            name="prefix"
                                            value={formData.prefix}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.prefix ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="VOUCHER"
                                        />
                                        {errors.prefix && (
                                            <p className="mt-1 text-sm text-red-600">{errors.prefix}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Suffix (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="suffix"
                                            value={formData.suffix}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="2024"
                                        />
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-sm text-gray-600 mb-2">Preview:</div>
                                        <div className="font-mono text-sm text-gray-900">
                                            {formData.prefix}_XXXXXX{formData.suffix ? '_' + formData.suffix : ''}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={generateCodes}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Generate Preview
                                    </button>
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

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Active Vouchers
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Generated Codes */}
                        <div className="space-y-6">
                            {/* Generated Codes */}
                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-gray-900">Generated Codes</h4>
                                    {generatedCodes.length > 0 && (
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={copyCodesToClipboard}
                                                className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={downloadCodes}
                                                className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {generatedCodes.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto">
                                        <div className="space-y-1">
                                            {generatedCodes.map((code, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm font-mono">
                                                    <span>{code}</span>
                                                    <span className="text-gray-400">#{index + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Gift className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">Click "Generate Preview" to see codes</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Package</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formData.packageKey || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Value</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            KES {formData.value}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Count</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formData.count} vouchers
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Total Value</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            KES {formData.value * formData.count}
                                        </span>
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
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Add any additional notes about these vouchers..."
                                    />
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
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create {formData.count} Vouchers
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkVoucherForm;
