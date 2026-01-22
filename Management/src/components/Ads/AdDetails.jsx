import React, { useState } from 'react';
import {
    X,
    Save,
    Calendar,
    Link as LinkIcon,
    Image as ImageIcon,
    Star,
    TrendingUp,
    Bell,
    Eye
} from 'lucide-react';

const AdDetails = ({ ad, onClose, onSave }) => {
    const isNewAd = !ad || !ad._id;
    const [isEditing, setIsEditing] = useState(isNewAd);
    const [formData, setFormData] = useState({
        title: ad?.title || '',
        content: ad?.content || '',
        type: ad?.type || 'promo',
        category: ad?.category || 'general',
        image: ad?.image || '',
        imageUrl: ad?.imageUrl || '',
        link: ad?.link || '',
        cta: ad?.cta || 'Learn More',
        featured: ad?.featured || false,
        trending: ad?.trending || false,
        showAsPopup: ad?.showAsPopup || false,
        sendPushNotification: ad?.sendPushNotification || false,
        priority: ad?.priority || 0,
        startDate: ad?.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: ad?.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
        active: ad?.active !== undefined ? ad.active : true,
        targetAudience: {
            all: ad?.targetAudience?.all !== undefined ? ad.targetAudience.all : true,
            newUsers: ad?.targetAudience?.newUsers || false,
            existingUsers: ad?.targetAudience?.existingUsers || false,
            verifiedUsers: ad?.targetAudience?.verifiedUsers || false
        },
        displaySettings: {
            showOnHomePage: ad?.displaySettings?.showOnHomePage !== undefined ? ad.displaySettings.showOnHomePage : true,
            showOnAdsPage: ad?.displaySettings?.showOnAdsPage !== undefined ? ad.displaySettings.showOnAdsPage : true,
            showOnPortal: ad?.displaySettings?.showOnPortal !== undefined ? ad.displaySettings.showOnPortal : true,
            maxDisplays: ad?.displaySettings?.maxDisplays || 0
        }
    });

    const handleChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = () => {
        // Validate required fields
        if (!formData.title || !formData.content) {
            alert('Title and content are required');
            return;
        }

        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                {isNewAd ? 'Create New Ad' : ad.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {isNewAd ? 'Add a new advertisement or promotion' : 'Ad Details'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                    </button>
                                    <button
                                        onClick={() => isNewAd ? onClose() : setIsEditing(false)}
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="promo">Promo</option>
                                        <option value="event">Event</option>
                                        <option value="partner">Partner</option>
                                        <option value="community">Community</option>
                                        <option value="sports">Sports</option>
                                        <option value="product">Product</option>
                                        <option value="service">Service</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="general">General</option>
                                        <option value="premier-league">Premier League</option>
                                        <option value="food">Food</option>
                                        <option value="services">Services</option>
                                        <option value="products">Products</option>
                                        <option value="events">Events</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => handleChange('content', e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Media */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image (Emoji or Icon)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => handleChange('image', e.target.value)}
                                        placeholder="🎉 or 📢"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Link */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Link URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => handleChange('link', e.target.value)}
                                        placeholder="https://example.com"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Call to Action
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cta}
                                        onChange={(e) => handleChange('cta', e.target.value)}
                                        placeholder="Learn More"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => handleChange('endDate', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Flags */}
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => handleChange('featured', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Featured</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.trending}
                                        onChange={(e) => handleChange('trending', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Trending</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.showAsPopup}
                                        onChange={(e) => handleChange('showAsPopup', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Show as Pop-up</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.sendPushNotification}
                                        onChange={(e) => handleChange('sendPushNotification', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Push Notification</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => handleChange('active', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Active</span>
                                </label>
                            </div>

                            {/* Display Settings */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Display Settings</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.displaySettings.showOnHomePage}
                                            onChange={(e) => handleChange('displaySettings.showOnHomePage', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Show on Home Page</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.displaySettings.showOnAdsPage}
                                            onChange={(e) => handleChange('displaySettings.showOnAdsPage', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Show on Ads Page</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.displaySettings.showOnPortal}
                                            onChange={(e) => handleChange('displaySettings.showOnPortal', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Show on Portal</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Content</h4>
                                <p className="mt-1 text-sm text-gray-900">{ad.content}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Type</h4>
                                    <p className="mt-1 text-sm text-gray-900">{ad.type}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                    <p className="mt-1 text-sm text-gray-900">{ad.active ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdDetails;
