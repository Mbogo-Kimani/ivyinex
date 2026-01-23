import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { getMessages, markMessageRead, markAllMessagesRead, getUnreadMessageCount } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function Messages() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [authLoading, user, router]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 20 };
            if (filter === 'unread') params.prop = 'unread';

            const data = await getMessages(params);
            setMessages(data.messages);
            setTotalPages(data.pagination.pages);

            // Update unread count
            const countData = await getUnreadMessageCount();
            setUnreadCount(countData.count);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMessages();
        }
    }, [user, page, filter]);

    const handleMarkRead = async (id) => {
        try {
            await markMessageRead(id);
            // Optimistic update
            setMessages(msgs => msgs.map(m =>
                m._id === id ? { ...m, isRead: true } : m
            ));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllMessagesRead();
            setMessages(msgs => msgs.map(m => ({ ...m, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    if (authLoading || !user) return null;

    return (
        <Layout>
            <Head>
                <title>Messages | Wifi Mtaani</title>
            </Head>

            <div className="section">
                <div className="container" style={{ maxWidth: 800 }}>
                    <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 className="title">Messages</h1>
                            <p className="subtitle">
                                You have <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{unreadCount}</span> unread messages
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <select
                                className="input"
                                style={{ width: 'auto', padding: '8px 12px' }}
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Messages</option>
                                <option value="unread">Unread Only</option>
                            </select>

                            {unreadCount > 0 && (
                                <button className="btn outline" onClick={handleMarkAllRead}>
                                    Mark All Read
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                            <h3>No messages yet</h3>
                            <p>Notifications about your account and rewards will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`card ${!msg.isRead ? 'unread-card' : ''}`}
                                    style={{
                                        padding: 16,
                                        borderLeft: !msg.isRead ? '4px solid var(--primary)' : '4px solid transparent',
                                        background: !msg.isRead ? 'var(--surface-hover)' : 'var(--surface)'
                                    }}
                                >
                                    <div className="flex-between" style={{ marginBottom: 8 }}>
                                        <h4 style={{ margin: 0, fontWeight: !msg.isRead ? 700 : 500 }}>
                                            {msg.type === 'referral' && '🎁 '}
                                            {msg.type === 'reward' && '💎 '}
                                            {msg.type === 'system' && '🔔 '}
                                            {msg.title}
                                        </h4>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
                                        {msg.body}
                                    </p>
                                    {!msg.isRead && (
                                        <div style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn-text"
                                                onClick={() => handleMarkRead(msg._id)}
                                                style={{ fontSize: 12 }}
                                            >
                                                Mark as read
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex-center" style={{ marginTop: 24, gap: 12 }}>
                            <button
                                className="btn ghost"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                className="btn ghost"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .unread-card {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .btn-text {
                    background: none;
                    border: none;
                    color: var(--primary);
                    cursor: pointer;
                    padding: 0;
                }
                .btn-text:hover {
                    text-decoration: underline;
                }
            `}</style>
        </Layout>
    );
}
