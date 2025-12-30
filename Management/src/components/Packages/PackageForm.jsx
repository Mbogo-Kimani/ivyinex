// PackageForm component for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    X,
    Package,
    DollarSign,
    Clock,
    Wifi,
    Activity,
    Save,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react';

const PackageForm = ({ package: pkg, mode, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        description: '',
        type: 'data',
        priceKES: 0,
        active: true,
        dataLimit: 0,
        duration: 0,
        speedLimit: 0,
        features: [],
        restrictions: [],
        priority: 1,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (pkg && mode === 'edit') {
            setFormData({
                name: pkg.name || '',
                key: pkg.key || '',
                description: pkg.description || '',
                type: pkg.type || 'data',
                priceKES: pkg.priceKES || 0,
                active: pkg.active !== undefined ? pkg.active : true,
                dataLimit: pkg.dataLimit || 0,
                duration: pkg.duration || 0,
                speedLimit: pkg.speedLimit || 0,
                features: pkg.features || [],
                restrictions: pkg.restrictions || [],
                priority: pkg.priority || 1,
            });
        }
    }, [pkg, mode]);

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

    const handleArrayChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addArrayItem = (field, value) => {
        if (value.trim()) {
            setFormData(prev => ({
                ...prev,
                [field]: [...prev[field], value.trim()]
            }));
        }
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Package name is required';
        }

        if (!formData.key.trim()) {
            newErrors.key = 'Package key is required';
        }

        if (formData.priceKES < 0) {
            newErrors.priceKES = 'Price must be positive';
        }

        if (formData.type === 'data' && formData.dataLimit <= 0) {
            newErrors.dataLimit = 'Data limit must be greater than 0';
        }

        if (formData.type === 'time' && formData.duration <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        }

        if (formData.speedLimit < 0) {
            newErrors.speedLimit = 'Speed limit must be positive';
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
            console.error('Error saving package:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'data':
                return <Wifi className="h-5 w-5 text-blue-600" />;
            case 'time':
                return <Clock className="h-5 w-5 text-green-600" />;
            case 'unlimited':
                return <Activity className="h-5 w-5 text-purple-600" />;
            default:
                return <Package className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        {getTypeIcon(formData.type)}
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                                {mode === 'create' ? 'Create New Package' : 'Edit Package'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {mode === 'create' ? 'Add a new internet package' : 'Update package details'}
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
                                            Package Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter package name"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Package Key *
                                        </label>
                                        <input
                                            type="text"
                                            name="key"
                                            value={formData.key}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.key ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter unique package key"
                                        />
                                        {errors.key && (
                                            <p className="mt-1 text-sm text-red-600">{errors.key}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter package description"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Package Type
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="data">Data Package</option>
                                            <option value="time">Time Package</option>
                                            <option value="unlimited">Unlimited Package</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Price (KES)
                                        </label>
                                        <input
                                            type="number"
                                            name="priceKES"
                                            value={formData.priceKES}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.priceKES ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="0.00"
                                        />
                                        {errors.priceKES && (
                                            <p className="mt-1 text-sm text-red-600">{errors.priceKES}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Priority
                                        </label>
                                        <input
                                            type="number"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="10"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
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
                                            Active Package
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Package Specific Settings */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Package Settings</h4>
                                <div className="space-y-4">
                                    {formData.type === 'data' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Data Limit (MB) *
                                            </label>
                                            <input
                                                type="number"
                                                name="dataLimit"
                                                value={formData.dataLimit}
                                                onChange={handleInputChange}
                                                min="0"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.dataLimit ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                placeholder="1000"
                                            />
                                            {errors.dataLimit && (
                                                <p className="mt-1 text-sm text-red-600">{errors.dataLimit}</p>
                                            )}
                                        </div>
                                    )}

                                    {formData.type === 'time' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Duration (Hours) *
                                            </label>
                                            <input
                                                type="number"
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.1"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.duration ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                placeholder="24"
                                            />
                                            {errors.duration && (
                                                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Speed Limit (Mbps)
                                        </label>
                                        <input
                                            type="number"
                                            name="speedLimit"
                                            value={formData.speedLimit}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.1"
                                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.speedLimit ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="0 (unlimited)"
                                        />
                                        {errors.speedLimit && (
                                            <p className="mt-1 text-sm text-red-600">{errors.speedLimit}</p>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Leave as 0 for unlimited speed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Features & Restrictions */}
                        <div className="space-y-6">
                            {/* Features */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Features</h4>
                                <div className="space-y-3">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex items-center">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => {
                                                    const newFeatures = [...formData.features];
                                                    newFeatures[index] = e.target.value;
                                                    handleArrayChange('features', newFeatures);
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter feature"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('features', index)}
                                                className="ml-2 text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Add new feature"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addArrayItem('features', e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                const input = e.target.previousElementSibling;
                                                addArrayItem('features', input.value);
                                                input.value = '';
                                            }}
                                            className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Restrictions */}
                            <div className="bg-white border rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Restrictions</h4>
                                <div className="space-y-3">
                                    {formData.restrictions.map((restriction, index) => (
                                        <div key={index} className="flex items-center">
                                            <input
                                                type="text"
                                                value={restriction}
                                                onChange={(e) => {
                                                    const newRestrictions = [...formData.restrictions];
                                                    newRestrictions[index] = e.target.value;
                                                    handleArrayChange('restrictions', newRestrictions);
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter restriction"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('restrictions', index)}
                                                className="ml-2 text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Add new restriction"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addArrayItem('restrictions', e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                const input = e.target.previousElementSibling;
                                                addArrayItem('restrictions', input.value);
                                                input.value = '';
                                            }}
                                            className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Add
                                        </button>
                                    </div>
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
                                    {mode === 'create' ? 'Create Package' : 'Update Package'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PackageForm;
