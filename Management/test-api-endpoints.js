// Test API endpoints with /api prefix
const axios = require('axios');

const API_URL = 'http://localhost:5000';

const endpoints = [
    '/',
    '/api',
    '/api/admin',
    '/api/admin/auth',
    '/api/admin/auth/create-admin',
    '/api/auth',
    '/api/auth/register',
    '/api/auth/login',
    '/api/admin/users',
    '/api/admin/system/health'
];

async function testEndpoints() {
    console.log('🔍 Testing API endpoints with /api prefix...');
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
            } else {
                console.log(`❌ ${endpoint} - ${error.message}`);
            }
        }
        console.log('');
    }
}

testEndpoints();
