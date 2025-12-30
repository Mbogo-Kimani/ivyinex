# Quick Start - Database Migration

## 🚀 Quick Migration Steps

### 1. View Current Database Info
```bash
cd backend
node scripts/view-database-info.js
```
This shows you what's currently in your database (packages, users, etc.)

### 2. Export All Data
```bash
# Make sure .env has your CURRENT (old) MONGO_URI
node scripts/export-database.js
```
This creates JSON files in `backend/database-exports/` with all your data.

### 3. Update Database Connection
Edit `backend/.env`:
```env
MONGO_URI=mongodb://your-new-connection-string
```

### 4. Import All Data
```bash
# Make sure .env now has your NEW MONGO_URI
node scripts/import-database.js
```
This imports all data into your new database.

## 📋 What Gets Migrated

✅ **Packages** - All package configurations  
✅ **Users** - All user accounts (including admins with passwords)  
✅ **Devices** - All registered devices  
✅ **Subscriptions** - All subscription records  
✅ **Vouchers** - All voucher codes  
✅ **Payments** - Payment history  
✅ **Points** - Points transactions  
✅ **Logs** - Application logs (optional)  

## ⚠️ Important Notes

- Export files contain sensitive data (passwords, etc.) - keep them secure!
- Make sure to backup before migration
- Verify both database connections work
- Test the application after migration

## 📖 Full Documentation

See `README-DATABASE-MIGRATION.md` for detailed instructions.


