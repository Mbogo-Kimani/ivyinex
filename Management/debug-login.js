// Debug login request
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugLogin() {
    try {
        console.log('🔍 Debugging login request...');
        console.log('🌐 API URL:', API_URL);
        console.log('');

        // Test the exact request format
        const credentials = {
            email: 'admin@ecowifi.com',
            password: 'Admin123!@#'
        };

        console.log('📤 Sending request with data:', JSON.stringify(credentials, null, 2));
        console.log('');

        const response = await axios.post(`${API_URL}/admin/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Success!');
        console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Error occurred:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Headers:', error.response.headers);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

debugLogin();
