/**
 * Database Info Viewer
 * Shows summary information about the current database
 * 
 * Usage: node backend/scripts/view-database-info.js
 * 
 * Make sure your .env file has MONGO_URI set
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Package = require('../models/PackageModel');
const User = require('../models/User');
const Device = require('../models/Device');
const Subscription = require('../models/Subscription');
const Voucher = require('../models/Voucher');
const Payment = require('../models/Payment');
const Points = require('../models/Points');
const Log = require('../models/Log');

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
        console.log('✅ Connected successfully\n');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function getCollectionInfo(collectionName, Model) {
    try {
        const count = await Model.countDocuments({});
        
        if (count === 0) {
            return { name: collectionName, count: 0, details: [] };
        }

        let details = [];

        // Special handling for different collections
        if (collectionName === 'users') {
            const adminCount = await Model.countDocuments({ role: 'admin' });
            const userCount = await Model.countDocuments({ role: 'user' });
            const admins = await Model.find({ role: 'admin' }).select('name phone email role createdAt').lean();
            
            details.push(`   - Admin users: ${adminCount}`);
            details.push(`   - Regular users: ${userCount}`);
            
            if (admins.length > 0) {
                details.push(`   - Admin details:`);
                admins.forEach(admin => {
                    details.push(`     • ${admin.name || 'N/A'} (${admin.phone}) - ${admin.email || 'No email'}`);
                });
            }
        }

        if (collectionName === 'packages') {
            const packages = await Model.find({}).select('name key priceKES durationSeconds speedKbps devicesAllowed').lean();
            details.push(`   - Package details:`);
            packages.forEach(pkg => {
                const hours = Math.round(pkg.durationSeconds / 3600);
                const mbps = Math.round(pkg.speedKbps / 1000);
                details.push(`     • ${pkg.name} (${pkg.key}): KES ${pkg.priceKES}, ${hours}hr, ${mbps}Mbps, ${pkg.devicesAllowed} device(s)`);
            });
        }

        if (collectionName === 'subscriptions') {
            const activeCount = await Model.countDocuments({ status: 'active', active: true });
            const expiredCount = await Model.countDocuments({ status: 'expired' });
            details.push(`   - Active: ${activeCount}`);
            details.push(`   - Expired: ${expiredCount}`);
        }

        if (collectionName === 'vouchers') {
            const usedCount = await Model.countDocuments({ usedCount: { $gt: 0 } });
            const unusedCount = await Model.countDocuments({ usedCount: 0 });
            details.push(`   - Used: ${usedCount}`);
            details.push(`   - Unused: ${unusedCount}`);
        }

        if (collectionName === 'devices') {
            const withUser = await Model.countDocuments({ userId: { $ne: null } });
            const withoutUser = await Model.countDocuments({ userId: null });
            details.push(`   - Linked to users: ${withUser}`);
            details.push(`   - Unlinked: ${withoutUser}`);
        }

        return { name: collectionName, count, details };
    } catch (error) {
        return { name: collectionName, count: 0, details: [`   ❌ Error: ${error.message}`] };
    }
}

async function viewDatabaseInfo() {
    try {
        await connectToDatabase();

        // Get database name
        const dbName = mongoose.connection.db.databaseName;
        console.log('='.repeat(60));
        console.log(`📊 DATABASE INFORMATION: ${dbName}`);
        console.log('='.repeat(60));
        console.log();

        // Get info for each collection
        const collections = [
            { name: 'packages', model: Package },
            { name: 'users', model: User },
            { name: 'devices', model: Device },
            { name: 'subscriptions', model: Subscription },
            { name: 'vouchers', model: Voucher },
            { name: 'payments', model: Payment },
            { name: 'points', model: Points },
            { name: 'logs', model: Log }
        ];

        const results = [];
        for (const collection of collections) {
            const info = await getCollectionInfo(collection.name, collection.model);
            results.push(info);
        }

        // Display results
        results.forEach(result => {
            console.log(`📦 ${result.name.toUpperCase().padEnd(15)}: ${result.count} document(s)`);
            if (result.details.length > 0) {
                result.details.forEach(detail => console.log(detail));
            }
            console.log();
        });

        // Summary
        const totalDocs = results.reduce((sum, r) => sum + r.count, 0);
        console.log('='.repeat(60));
        console.log(`📊 TOTAL DOCUMENTS: ${totalDocs}`);
        console.log('='.repeat(60));

        console.log('\n✅ Database info retrieved successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Run: node scripts/export-database.js');
        console.log('   2. Update MONGO_URI in .env to new database');
        console.log('   3. Run: node scripts/import-database.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run
viewDatabaseInfo();


