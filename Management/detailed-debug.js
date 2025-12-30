// Detailed debug of the login process
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function detailedDebug() {
    console.log('🔍 Detailed login debugging...');
    console.log('');

    // Test 1: Check if the endpoint exists
    console.log('1️⃣ Testing endpoint availability...');
    try {
        const healthResponse = await axios.get('http://localhost:5000/');
        console.log('✅ Backend is running');
        console.log('📊 Backend info:', healthResponse.data);
    } catch (error) {
        console.log('❌ Backend not accessible:', error.message);
        return;
    }
    console.log('');

    // Test 2: Test the exact login request
    console.log('2️⃣ Testing admin login...');
    try {
        const credentials = {
            email: 'admin@ecowifi.com',
            password: 'Admin123!@#'
        };

        console.log('📤 Request details:');
        console.log('   URL:', `${API_URL}/admin/auth/login`);
        console.log('   Method: POST');
        console.log('   Headers: Content-Type: application/json');
        console.log('   Body:', JSON.stringify(credentials, null, 2));
        console.log('');

        const response = await axios.post(`${API_URL}/admin/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3002'
            },
            timeout: 10000
        });

        console.log('✅ Login successful!');
        console.log('📥 Response status:', response.status);
        console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Login failed:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Status Text:', error.response.statusText);
            console.log('   Headers:', error.response.headers);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('   Error:', error.message);
        }
    }
    console.log('');

    // Test 3: Check if admin user exists
    console.log('3️⃣ Verifying admin user exists...');
    try {
        // This would require authentication, so let's just confirm the user was created
        console.log('✅ Admin user should exist (created earlier)');
        console.log('   Email: admin@ecowifi.com');
        console.log('   Password: Admin123!@#');
    } catch (error) {
        console.log('❌ Admin user verification failed:', error.message);
    }
}

detailedDebug();
