/**
 * Database Export Script
 * Exports all data from the current MongoDB database to JSON files
 * 
 * Usage: node backend/scripts/export-database.js
 * 
 * Make sure your .env file has the current MONGO_URI set
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import all models
const Package = require('../models/PackageModel');
const User = require('../models/User');
const Device = require('../models/Device');
const Subscription = require('../models/Subscription');
const Voucher = require('../models/Voucher');
const Payment = require('../models/Payment');
const Points = require('../models/Points');
const Log = require('../models/Log');

// Create exports directory
const EXPORTS_DIR = path.join(__dirname, '..', 'database-exports');
const EXPORT_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();

async function ensureExportsDir() {
    try {
        await fs.mkdir(EXPORTS_DIR, { recursive: true });
        console.log('✅ Exports directory ready');
    } catch (error) {
        console.error('❌ Error creating exports directory:', error);
        throw error;
    }
}

async function connectToDatabase() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI not set in .env file');
    }

    console.log('🔌 Connecting to database...');
    console.log('📍 Database URI:', uri.replace(/\/\/.*@/, '//***@')); // Hide credentials

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to database successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function exportCollection(collectionName, Model) {
    try {
        console.log(`\n📦 Exporting ${collectionName}...`);
        const documents = await Model.find({}).lean();
        const count = documents.length;
        
        if (count === 0) {
            console.log(`   ⚠️  No ${collectionName} found`);
            return { collection: collectionName, count: 0, data: [] };
        }

        console.log(`   ✅ Found ${count} ${collectionName} document(s)`);
        
        // Special handling for sensitive data
        if (collectionName === 'users') {
            console.log(`   🔍 Analyzing users...`);
            const adminUsers = documents.filter(u => u.role === 'admin');
            const regularUsers = documents.filter(u => u.role === 'user');
            console.log(`      - Admin users: ${adminUsers.length}`);
            console.log(`      - Regular users: ${regularUsers.length}`);
            
            // Log admin user details (without password)
            adminUsers.forEach(admin => {
                console.log(`      👤 Admin: ${admin.name || 'N/A'} (${admin.phone}) - Email: ${admin.email || 'N/A'}`);
            });
        }

        if (collectionName === 'packages') {
            console.log(`   📋 Package details:`);
            documents.forEach(pkg => {
                console.log(`      - ${pkg.name} (${pkg.key}): KES ${pkg.priceKES}, ${Math.round(pkg.durationSeconds / 3600)}hr, ${Math.round(pkg.speedKbps / 1000)}Mbps`);
            });
        }

        return { collection: collectionName, count, data: documents };
    } catch (error) {
        console.error(`   ❌ Error exporting ${collectionName}:`, error.message);
        return { collection: collectionName, count: 0, data: [], error: error.message };
    }
}

async function saveExport(data, filename) {
    const filePath = path.join(EXPORTS_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`   💾 Saved to: ${filename}`);
    return filePath;
}

async function exportAllData() {
    try {
        await ensureExportsDir();
        await connectToDatabase();

        console.log('\n🚀 Starting database export...\n');

        // Export all collections
        const exports = {
            timestamp: new Date().toISOString(),
            database: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***@') : 'unknown',
            collections: {}
        };

        // Export each collection
        const packages = await exportCollection('packages', Package);
        const users = await exportCollection('users', User);
        const devices = await exportCollection('devices', Device);
        const subscriptions = await exportCollection('subscriptions', Subscription);
        const vouchers = await exportCollection('vouchers', Voucher);
        const payments = await exportCollection('payments', Payment);
        const points = await exportCollection('points', Points);
        const logs = await exportCollection('logs', Log);

        // Store in exports object
        exports.collections = {
            packages,
            users,
            devices,
            subscriptions,
            vouchers,
            payments,
            points,
            logs
        };

        // Save complete export
        const exportFilename = `database-export-${EXPORT_TIMESTAMP}.json`;
        await saveExport(exports, exportFilename);

        // Save individual collection files for easier import
        await saveExport(packages.data, `packages-${EXPORT_TIMESTAMP}.json`);
        await saveExport(users.data, `users-${EXPORT_TIMESTAMP}.json`);
        await saveExport(devices.data, `devices-${EXPORT_TIMESTAMP}.json`);
        await saveExport(subscriptions.data, `subscriptions-${EXPORT_TIMESTAMP}.json`);
        await saveExport(vouchers.data, `vouchers-${EXPORT_TIMESTAMP}.json`);
        await saveExport(payments.data, `payments-${EXPORT_TIMESTAMP}.json`);
        await saveExport(points.data, `points-${EXPORT_TIMESTAMP}.json`);
        await saveExport(logs.data, `logs-${EXPORT_TIMESTAMP}.json`);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 EXPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Packages:      ${packages.count}`);
        console.log(`Users:         ${users.count} (${users.data.filter(u => u.role === 'admin').length} admin, ${users.data.filter(u => u.role === 'user').length} regular)`);
        console.log(`Devices:       ${devices.count}`);
        console.log(`Subscriptions: ${subscriptions.count}`);
        console.log(`Vouchers:      ${vouchers.count}`);
        console.log(`Payments:      ${payments.count}`);
        console.log(`Points:        ${points.count}`);
        console.log(`Logs:          ${logs.count}`);
        console.log('='.repeat(60));
        console.log(`\n✅ Export completed successfully!`);
        console.log(`📁 Files saved to: ${EXPORTS_DIR}`);
        console.log(`\n⚠️  IMPORTANT: Keep these files secure, especially user data with passwords!`);

    } catch (error) {
        console.error('\n❌ Export failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run export
exportAllData();


