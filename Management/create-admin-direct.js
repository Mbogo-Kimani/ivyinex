// Direct admin creation script
const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Try different endpoints
const endpoints = [
    '/api/admin/auth/create-admin',
    '/api/auth/create-admin',
    '/api/admin/create-admin',
    '/api/auth/register'
];

const adminData = {
    name: 'System Administrator',
    email: 'admin@ecowifi.com',
    password: 'Admin123!@#',
    phone: '254700000000' // Required for user creation
};

async function tryCreateAdmin() {
    console.log('🚀 Attempting to create admin user...');
    console.log('📧 Email:', adminData.email);
    console.log('👤 Name:', adminData.name);
    console.log('🌐 Backend URL:', API_URL);
    console.log('');

    for (const endpoint of endpoints) {
        try {
            console.log(`🔄 Trying endpoint: ${endpoint}`);

            const response = await axios.post(`${API_URL}${endpoint}`, adminData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log(`✅ Success with endpoint: ${endpoint}`);
            console.log('📋 Response:', response.data);

            if (response.data.success || response.data.ok) {
                console.log('');
                console.log('🔑 Admin user created! You can login with:');
                console.log('   Email:', adminData.email);
                console.log('   Password:', adminData.password);
                console.log('');
                console.log('🌐 Management URL: http://localhost:3002/');
                return;
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${endpoint} failed:`, error.response.status, error.response.data.error || error.response.data.message);
            } else {
                console.log(`❌ ${endpoint} failed:`, error.message);
            }
        }
        console.log('');
    }

    console.log('❌ All endpoints failed. Please check:');
    console.log('   1. Backend is running');
    console.log('   2. Database is connected');
    console.log('   3. Admin creation endpoint exists');
    console.log('');
    console.log('💡 Manual creation options:');
    console.log('   1. Use MongoDB directly');
    console.log('   2. Check backend logs');
    console.log('   3. Verify admin routes are properly mounted');
}

// Run the script
tryCreateAdmin();
