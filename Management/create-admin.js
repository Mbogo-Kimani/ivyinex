// Script to create an admin user for Eco Wifi Management System
import axios from 'axios';

const API_URL = 'https://eco-wifi.onrender.com';

// Admin user data
const adminData = {
    name: 'System Administrator',
    email: 'admin@ecowifi.com',
    password: 'Admin123!@#'
};

async function createAdmin() {
    try {
        console.log('🚀 Creating admin user...');
        console.log('📧 Email:', adminData.email);
        console.log('👤 Name:', adminData.name);
        
        const response = await axios.post(`${API_URL}/admin/auth/create-admin`, adminData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.data.success) {
            console.log('✅ Admin user created successfully!');
            console.log('📋 Admin Details:');
            console.log('   ID:', response.data.user.id);
            console.log('   Name:', response.data.user.name);
            console.log('   Email:', response.data.user.email);
            console.log('   Role:', response.data.user.role);
            console.log('');
            console.log('🔑 You can now login to the management system with:');
            console.log('   Email:', adminData.email);
            console.log('   Password:', adminData.password);
            console.log('');
            console.log('🌐 Management URL: http://localhost:3002/');
        } else {
            console.log('❌ Failed to create admin user');
            console.log('Response:', response.data);
        }
    } catch (error) {
        if (error.response) {
            console.log('❌ Error creating admin user:');
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.error || error.response.data.message);
            
            if (error.response.data.error === 'Admin user already exists') {
                console.log('');
                console.log('ℹ️  Admin user already exists. You can login with:');
                console.log('   Email:', adminData.email);
                console.log('   Password:', adminData.password);
            }
        } else if (error.request) {
            console.log('❌ Network error - could not reach the server');
            console.log('Make sure the backend is running at:', API_URL);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

// Run the script
createAdmin();
