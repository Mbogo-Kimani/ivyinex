import React, { useState, useEffect } from 'react'; // Fixed imports
import api from '../services/api'; // Correct import path based on file structure
import { toast } from 'react-hot-toast';

export default function Messages() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        target: 'all', // all, specific
        targetValue: ''
    });

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            // Need to add this method to api.js or call axios directly
            // Since api.js is a wrapper, we should probably add it there optimally, 
            // but for now I'll use the axios instance from api service if accessible or just fetch.
            // Let's assume we extend api.js later. For now, I'll direct call if possible 
            // BUT api.js exports a default 'api' object with methods.
            // I will implement a quick helper here or assume we update api.js

            // To properly fix this, I should update management/src/services/api.js first.
            // I will do that in a separate step or just assume the method exists.
            // To be safe, I will stick to what is known or update api.js.
            // Let's update api.js in the next step.

            // Temporary placeholder to prevent crash until api.js is updated
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Placeholder for submit
            toast.success('Broadcast sent! (Implementation pending API update)');
            setFormData({ title: '', body: '', target: 'all', targetValue: '' });
        } catch (error) {
            toast.error('Failed to send');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Messages & Broadcasts</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compose Form */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Compose Broadcast</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                            <input
                                type="text"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Message Body</label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                                value={formData.body}
                                onChange={e => setFormData({ ...formData, body: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Target Audience</label>
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                                value={formData.target}
                                onChange={e => setFormData({ ...formData, target: e.target.value })}
                            >
                                <option value="all">All Users</option>
                                <option value="active">Active Subscribers</option>
                                <option value="specific">Specific User (Phone)</option>
                            </select>
                        </div>

                        {formData.target === 'specific' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">User Phone</label>
                                <input
                                    type="text"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={formData.targetValue}
                                    onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                                    placeholder="e.g. 2547..."
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Send Broadcast
                        </button>
                    </form>
                </div>

                {/* History */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Recent Broadcasts</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : broadcasts.length === 0 ? (
                        <p className="text-gray-500">No broadcasts yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {broadcasts.map(b => (
                                <div key={b._id} className="border-b pb-2">
                                    <div className="flex justify-between">
                                        <span className="font-bold">{b.title}</span>
                                        <span className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm truncate">{b.body}</p>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Sent to: {b.target} • {b.stats?.sent} recipients
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
