// Ads Management page for Eco Wifi Management System
import { useState, useEffect } from 'react';
import {
    Megaphone,
    Plus,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    Star,
    Calendar,
    Link as LinkIcon,
    Image as ImageIcon,
    Filter,
    Search
} from 'lucide-react';
import { useData } from '../hooks/useApi.jsx';
import { apiMethods } from '../services/api';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import AdDetails from '../components/Ads/AdDetails';

const Ads = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAdModal, setShowAdModal] = useState(false);
    const [selectedAd, setSelectedAd] = useState(null);
    const { isAuthenticated } = useAuth();

    // Fetch ads data
    const { data: adsData, loading: adsLoading, refetch: refetchAds } = useData(
        async () => {
            const response = await apiMethods.getAds();
            return response.ads || [];
        },
        [],
        { enabled: isAuthenticated }
    );

    // Filter and search ads
    const filteredAds = (adsData || []).filter(ad => {
        const matchesSearch = 
            ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ad.content?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || ad.type === filterType;
        const matchesStatus = 
            filterStatus === 'all' ||
            (filterStatus === 'active' && ad.active) ||
            (filterStatus === 'inactive' && !ad.active);

        return matchesSearch && matchesType && matchesStatus;
    });

    const handleCreateAd = () => {
        setSelectedAd(null);
        setShowAdModal(true);
    };

    const handleEditAd = (ad) => {
        setSelectedAd(ad);
        setShowAdModal(true);
    };

    const handleDeleteAd = async (adId) => {
        if (window.confirm('Are you sure you want to delete this ad?')) {
            try {
                await apiMethods.deleteAd(adId);
                toast.success('Ad deleted successfully');
                refetchAds();
            } catch (error) {
                console.error('Error deleting ad:', error);
                toast.error('Failed to delete ad');
            }
        }
    };

    const handleSaveAd = async (adData) => {
        try {
            if (selectedAd && selectedAd._id) {
                await apiMethods.updateAd(selectedAd._id, adData);
                toast.success('Ad updated successfully');
            } else {
                await apiMethods.createAd(adData);
                toast.success('Ad created successfully');
            }
            refetchAds();
            setShowAdModal(false);
        } catch (error) {
            console.error('Error saving ad:', error);
            toast.error(selectedAd ? 'Failed to update ad' : 'Failed to create ad');
        }
    };

    const getTypeBadge = (type) => {
        const colors = {
            promo: 'bg-blue-100 text-blue-800',
            event: 'bg-purple-100 text-purple-800',
            partner: 'bg-green-100 text-green-800',
            community: 'bg-yellow-100 text-yellow-800',
            sports: 'bg-red-100 text-red-800',
            product: 'bg-indigo-100 text-indigo-800',
            service: 'bg-pink-100 text-pink-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Megaphone className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ads & Promotions</h1>
                        <p className="text-sm text-gray-500">
                            Manage advertisements and promotional content
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCreateAd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ad
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search ads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="promo">Promo</option>
                        <option value="event">Event</option>
                        <option value="partner">Partner</option>
                        <option value="community">Community</option>
                        <option value="sports">Sports</option>
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Ads Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {adsLoading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredAds.map((ad) => (
                            <div key={ad._id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {ad.title}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(ad.type)}`}>
                                                {ad.type}
                                            </span>
                                            {ad.featured && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Featured
                                                </span>
                                            )}
                                            {ad.trending && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    Trending
                                                </span>
                                            )}
                                            {ad.showAsPopup && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Pop-up
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {ad.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(ad.startDate)}
                                                {ad.endDate && ` - ${formatDate(ad.endDate)}`}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {ad.views || 0} views
                                            </div>
                                            {ad.link && (
                                                <div className="flex items-center gap-1">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Has link
                                                </div>
                                            )}
                                            {ad.imageUrl && (
                                                <div className="flex items-center gap-1">
                                                    <ImageIcon className="w-4 h-4" />
                                                    Has image
                                                </div>
                                            )}
                                            <span className={`px-2 py-1 rounded ${ad.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {ad.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleEditAd(ad)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAd(ad._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredAds.length === 0 && !adsLoading && (
                    <div className="text-center py-12">
                        <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No ads found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating a new ad.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Ad Details Modal */}
            {showAdModal && (
                <AdDetails
                    ad={selectedAd}
                    onClose={() => setShowAdModal(false)}
                    onSave={handleSaveAd}
                />
            )}
        </div>
    );
};

export default Ads;
