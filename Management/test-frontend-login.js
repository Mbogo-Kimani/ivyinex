// Test frontend login flow
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFrontendLogin() {
    console.log('🔍 Testing frontend login flow...');
    console.log('');

    try {
        // Simulate the exact request the frontend makes
        const credentials = {
            email: 'admin@ecowifi.com',
            password: 'Admin123!@#'
        };

        console.log('📤 Frontend request:');
        console.log('   URL:', `${API_URL}/admin/auth/login`);
        console.log('   Method: POST');
        console.log('   Headers: Content-Type: application/json, Origin: http://localhost:3002');
        console.log('   Body:', JSON.stringify(credentials, null, 2));
        console.log('');

        const response = await axios.post(`${API_URL}/admin/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3002'
            },
            timeout: 10000
        });

        console.log('📥 Backend response:');
        console.log('   Status:', response.status);
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        console.log('');

        // Test the auth service logic
        console.log('🧪 Testing auth service logic:');
        const responseData = response.data;

        console.log('   response.success:', responseData.success);
        console.log('   response.token:', responseData.token ? 'Present' : 'Missing');
        console.log('   response.user:', responseData.user ? 'Present' : 'Missing');

        if (responseData.success && responseData.token) {
            console.log('✅ Auth service would succeed');
            console.log('   Token:', responseData.token.substring(0, 20) + '...');
            console.log('   User:', responseData.user);
        } else {
            console.log('❌ Auth service would fail');
            console.log('   Reason: Missing success or token');
        }

    } catch (error) {
        console.log('❌ Request failed:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('   Error:', error.message);
        }
    }
}

testFrontendLogin();





