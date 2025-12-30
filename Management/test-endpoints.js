// Test available endpoints
const axios = require('axios');

const API_URL = 'http://localhost:5000';

const endpoints = [
    '/',
    '/admin',
    '/admin/auth',
    '/admin/auth/create-admin',
    '/auth',
    '/auth/register',
    '/auth/login',
    '/admin/users',
    '/admin/system/health'
];

async function testEndpoints() {
    console.log('🔍 Testing available endpoints...');
    console.log('🌐 Backend URL:', API_URL);
    console.log('');

    for (const endpoint of endpoints) {
        try {
            console.log(`🔄 Testing: ${endpoint}`);
            const response = await axios.get(`${API_URL}${endpoint}`, {
                timeout: 5000
            });
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
            if (response.data) {
                console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${endpoint} - Status: ${error.response.status}`);
                if (error.response.data) {
                    console.log(`   Error: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
                }
            } else {
                console.log(`❌ ${endpoint} - ${error.message}`);
            }
        }
        console.log('');
    }
}

testEndpoints();
