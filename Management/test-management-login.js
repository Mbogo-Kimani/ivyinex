// Test management system login
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testManagementLogin() {
    try {
        console.log('🔍 Testing management system login...');
        console.log('🌐 API URL:', API_URL);
        console.log('');

        const credentials = {
            email: 'admin@ecowifi.com',
            password: 'Admin123!@#'
        };

        console.log('🔄 Attempting login...');
        const response = await axios.post(`${API_URL}/admin/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.data.success) {
            console.log('✅ Login successful!');
            console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');
            console.log('👤 User info:', response.data.user);
            console.log('');
            console.log('🎯 Management system should now work!');
            console.log('🌐 Access: http://localhost:3002/');
        } else {
            console.log('❌ Login failed:', response.data);
        }
    } catch (error) {
        if (error.response) {
            console.log('❌ Login error:');
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.error || error.response.data.message);
        } else {
            console.log('❌ Network error:', error.message);
        }
    }
}

testManagementLogin();
