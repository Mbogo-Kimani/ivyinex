// WebSocket service for real-time updates
import { io } from 'socket.io-client';
import config from '../config/env';
import authService from './auth';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        this.connectionAttempted = false;
    }

    // Connect to WebSocket server
    connect() {
        // Check if WebSocket is enabled
        if (!config.WS_ENABLED) {
            // Only log once to avoid spam
            if (!this.connectionAttempted) {
                console.log('WebSocket connection disabled - set VITE_WS_ENABLED=true to enable');
                this.connectionAttempted = true;
            }
            return;
        }

        if (this.socket?.connected) {
            return;
        }

        const token = authService.getToken();
        if (!token) {
            console.warn('No auth token available for WebSocket connection');
            return;
        }

        this.socket = io(config.WS_URL, {
            auth: {
                token: token
            },
            transports: ['websocket'],
            timeout: 20000,
        });

        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            this.connected = false;

            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                this.handleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.handleReconnect();
        });

        // Real-time data events
        this.socket.on('user_updated', (data) => {
            this.emit('user_updated', data);
        });

        this.socket.on('subscription_updated', (data) => {
            this.emit('subscription_updated', data);
        });

        this.socket.on('device_updated', (data) => {
            this.emit('device_updated', data);
        });

        this.socket.on('payment_updated', (data) => {
            this.emit('payment_updated', data);
        });

        this.socket.on('system_alert', (data) => {
            this.emit('system_alert', data);
        });

        this.socket.on('log_created', (data) => {
            this.emit('log_created', data);
        });
    }

    // Handle reconnection
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    // Disconnect from WebSocket server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Emit custom events
    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    // Listen for custom events
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Get connection status
    isConnected() {
        return this.connected && this.socket?.connected;
    }

    // Join room for specific data
    joinRoom(room) {
        if (this.socket) {
            this.socket.emit('join_room', room);
        }
    }

    // Leave room
    leaveRoom(room) {
        if (this.socket) {
            this.socket.emit('leave_room', room);
        }
    }

    // Subscribe to real-time updates
    subscribeToUpdates(type, callback) {
        this.on(`${type}_updated`, callback);
    }

    // Unsubscribe from updates
    unsubscribeFromUpdates(type, callback) {
        this.off(`${type}_updated`, callback);
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
