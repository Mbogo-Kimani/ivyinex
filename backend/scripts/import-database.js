/**
 * Database Import Script
 * Imports all data from JSON export files into the new MongoDB database
 * 
 * Usage: node backend/scripts/import-database.js [export-file-path]
 * 
 * If no file path is provided, it will look for the most recent export file
 * Make sure your .env file has the NEW MONGO_URI set
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

const EXPORTS_DIR = path.join(__dirname, '..', 'database-exports');

async function connectToDatabase() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI not set in .env file');
    }

    console.log('🔌 Connecting to NEW database...');
    console.log('📍 Database URI:', uri.replace(/\/\/.*@/, '//***@')); // Hide credentials

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to new database successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function findLatestExport() {
    try {
        const files = await fs.readdir(EXPORTS_DIR);
        const exportFiles = files.filter(f => f.startsWith('database-export-') && f.endsWith('.json'));
        
        if (exportFiles.length === 0) {
            throw new Error('No export files found in database-exports directory');
        }

        // Sort by timestamp (newest first)
        exportFiles.sort().reverse();
        const latestFile = path.join(EXPORTS_DIR, exportFiles[0]);
        console.log(`📄 Found latest export: ${exportFiles[0]}`);
        return latestFile;
    } catch (error) {
        console.error('❌ Error finding export file:', error.message);
        throw error;
    }
}

async function loadExportFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading export file:', error.message);
        throw error;
    }
}

async function importCollection(collectionName, Model, documents, options = {}) {
    try {
        if (!documents || documents.length === 0) {
            console.log(`   ⚠️  No ${collectionName} to import`);
            return { collection: collectionName, imported: 0, skipped: 0, errors: [] };
        }

        console.log(`\n📦 Importing ${collectionName}...`);
        console.log(`   📊 Found ${documents.length} document(s) to import`);

        let imported = 0;
        let skipped = 0;
        const errors = [];

        // Handle different import strategies
        if (options.clearFirst) {
            console.log(`   🗑️  Clearing existing ${collectionName}...`);
            await Model.deleteMany({});
        }

        // Import documents
        for (const doc of documents) {
            try {
                // Remove _id to allow MongoDB to create new ones (or keep if you want to preserve IDs)
                const docToInsert = { ...doc };
                
                if (options.preserveIds !== true) {
                    delete docToInsert._id;
                }

                // Use insertOne or create depending on whether we want to handle duplicates
                if (options.upsert) {
                    // For collections with unique fields, use upsert
                    const uniqueField = getUniqueField(collectionName);
                    if (uniqueField && docToInsert[uniqueField]) {
                        await Model.findOneAndUpdate(
                            { [uniqueField]: docToInsert[uniqueField] },
                            docToInsert,
                            { upsert: true, new: true }
                        );
                    } else {
                        await Model.create(docToInsert);
                    }
                } else {
                    await Model.create(docToInsert);
                }
                imported++;
            } catch (error) {
                if (error.code === 11000) {
                    // Duplicate key error
                    skipped++;
                    console.log(`   ⚠️  Skipped duplicate: ${doc.name || doc.code || doc.phone || doc.mac || 'unknown'}`);
                } else {
                    errors.push({ document: doc, error: error.message });
                    console.log(`   ❌ Error importing document: ${error.message}`);
                }
            }
        }

        console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors.length}`);
        return { collection: collectionName, imported, skipped, errors };
    } catch (error) {
        console.error(`   ❌ Error importing ${collectionName}:`, error.message);
        return { collection: collectionName, imported: 0, skipped: 0, errors: [{ error: error.message }] };
    }
}

function getUniqueField(collectionName) {
    const uniqueFields = {
        packages: 'key',
        users: 'phone',
        devices: 'mac',
        vouchers: 'code'
    };
    return uniqueFields[collectionName];
}

async function importAllData(exportData) {
    try {
        await connectToDatabase();

        console.log('\n🚀 Starting database import...\n');
        console.log('⚠️  WARNING: This will import data into your NEW database!');
        console.log('⚠️  Make sure MONGO_URI in .env points to the NEW database!\n');

        const results = {};

        // Import in order (respecting dependencies)
        // 1. Packages (no dependencies)
        if (exportData.collections.packages && exportData.collections.packages.data) {
            results.packages = await importCollection(
                'packages',
                Package,
                exportData.collections.packages.data,
                { upsert: true, clearFirst: false }
            );
        }

        // 2. Users (no dependencies, but needed by other collections)
        if (exportData.collections.users && exportData.collections.users.data) {
            results.users = await importCollection(
                'users',
                User,
                exportData.collections.users.data,
                { upsert: true, clearFirst: false }
            );
        }

        // 3. Devices (depends on Users)
        if (exportData.collections.devices && exportData.collections.devices.data) {
            results.devices = await importCollection(
                'devices',
                Device,
                exportData.collections.devices.data,
                { upsert: true, clearFirst: false }
            );
        }

        // 4. Vouchers (no dependencies)
        if (exportData.collections.vouchers && exportData.collections.vouchers.data) {
            results.vouchers = await importCollection(
                'vouchers',
                Voucher,
                exportData.collections.vouchers.data,
                { upsert: true, clearFirst: false }
            );
        }

        // 5. Payments (depends on Users)
        if (exportData.collections.payments && exportData.collections.payments.data) {
            results.payments = await importCollection(
                'payments',
                Payment,
                exportData.collections.payments.data,
                { upsert: false, clearFirst: false }
            );
        }

        // 6. Points (depends on Users)
        if (exportData.collections.points && exportData.collections.points.data) {
            results.points = await importCollection(
                'points',
                Points,
                exportData.collections.points.data,
                { upsert: false, clearFirst: false }
            );
        }

        // 7. Subscriptions (depends on Users, Devices, Packages)
        if (exportData.collections.subscriptions && exportData.collections.subscriptions.data) {
            results.subscriptions = await importCollection(
                'subscriptions',
                Subscription,
                exportData.collections.subscriptions.data,
                { upsert: false, clearFirst: false }
            );
        }

        // 8. Logs (optional, usually not critical)
        if (exportData.collections.logs && exportData.collections.logs.data) {
            results.logs = await importCollection(
                'logs',
                Log,
                exportData.collections.logs.data,
                { upsert: false, clearFirst: false }
            );
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        Object.keys(results).forEach(key => {
            const result = results[key];
            console.log(`${key.padEnd(15)}: Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`);
        });
        console.log('='.repeat(60));

        const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
        const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

        if (totalErrors === 0) {
            console.log(`\n✅ Import completed successfully!`);
            console.log(`📊 Total documents imported: ${totalImported}`);
        } else {
            console.log(`\n⚠️  Import completed with ${totalErrors} error(s)`);
            console.log(`📊 Total documents imported: ${totalImported}`);
        }

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Main execution
async function main() {
    const exportFilePath = process.argv[2];

    try {
        let exportData;

        if (exportFilePath) {
            console.log(`📄 Using specified export file: ${exportFilePath}`);
            exportData = await loadExportFile(exportFilePath);
        } else {
            console.log('📄 Looking for latest export file...');
            const latestFile = await findLatestExport();
            exportData = await loadExportFile(latestFile);
        }

        console.log(`\n📅 Export timestamp: ${exportData.timestamp || 'unknown'}`);
        console.log(`📊 Collections in export: ${Object.keys(exportData.collections || {}).length}\n`);

        await importAllData(exportData);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();


