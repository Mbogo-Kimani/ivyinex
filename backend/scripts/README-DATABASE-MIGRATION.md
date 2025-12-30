# Database Migration Guide

This guide will help you export all data from your current MongoDB database and import it into a new MongoDB database.

## ⚠️ Important Notes

1. **Backup First**: Always backup your current database before migration
2. **Test Connection**: Verify both old and new database connections work
3. **Secure Files**: Export files contain sensitive data (passwords, etc.) - keep them secure
4. **Environment Variables**: Make sure your `.env` file has the correct `MONGO_URI` for each step

## 📋 Step-by-Step Migration Process

### Step 1: Export Data from Current Database

1. **Update your `.env` file** with the CURRENT (old) MongoDB connection string:
   ```env
   MONGO_URI=mongodb://your-current-connection-string
   ```

2. **Run the export script**:
   ```bash
   cd backend
   node scripts/export-database.js
   ```

3. **Verify the export**:
   - Check the `backend/database-exports/` directory
   - You should see files like:
     - `database-export-[timestamp].json` (complete export)
     - `packages-[timestamp].json`
     - `users-[timestamp].json`
     - `devices-[timestamp].json`
     - etc.

4. **Review the export summary**:
   - The script will show counts for each collection
   - Pay special attention to:
     - **Packages**: All your package configurations
     - **Admin Users**: Admin user details (without passwords, but you'll see phone/email)

### Step 2: Update to New Database

1. **Update your `.env` file** with the NEW MongoDB connection string:
   ```env
   MONGO_URI=mongodb://your-new-connection-string
   ```

2. **Verify the new connection**:
   - Make sure the new database is accessible
   - The new database can be empty (it will be populated by the import)

### Step 3: Import Data to New Database

1. **Run the import script**:
   ```bash
   cd backend
   node scripts/import-database.js
   ```
   
   Or specify a specific export file:
   ```bash
   node scripts/import-database.js database-exports/database-export-2024-01-01_1234567890.json
   ```

2. **Review the import summary**:
   - Check that all collections were imported successfully
   - Note any skipped duplicates or errors

### Step 4: Verify Migration

1. **Test the application**:
   - Start your backend server
   - Verify packages are visible
   - Test admin login
   - Check that subscriptions, devices, etc. are accessible

2. **Verify critical data**:
   - ✅ All packages are present
   - ✅ Admin users can log in
   - ✅ User accounts are accessible
   - ✅ Subscriptions are intact
   - ✅ Devices are linked correctly

## 📊 What Gets Exported/Imported

### Collections Exported:

1. **Packages** - All package configurations
   - Package name, price, duration, speed, etc.
   - Critical for your service offerings

2. **Users** - All user accounts including admins
   - Phone numbers, emails, passwords (hashed)
   - User roles (admin/user)
   - Points balances
   - Referral codes

3. **Devices** - All registered devices
   - MAC addresses
   - Device names
   - User associations
   - MikroTik connection data

4. **Subscriptions** - All active/expired subscriptions
   - Package associations
   - User and device links
   - Start/end dates
   - Payment information

5. **Vouchers** - All voucher codes
   - Voucher codes
   - Package associations
   - Usage counts

6. **Payments** - Payment records
   - Payment amounts
   - Payment status
   - User associations

7. **Points** - Points transaction history
   - Points earned/spent
   - Transaction types
   - User associations

8. **Logs** - Application logs (optional)
   - Usually not critical for migration

## 🔐 Security Considerations

- **Export files contain sensitive data**:
  - User passwords (hashed, but still sensitive)
  - Phone numbers
  - Email addresses
  - Payment information

- **Best practices**:
  - Delete export files after successful migration
  - Store them securely during migration
  - Don't commit them to version control
  - Use secure file transfer if migrating between servers

## 🐛 Troubleshooting

### Export Issues

**Problem**: Connection timeout
- **Solution**: Check your current MONGO_URI in `.env`
- Verify network connectivity to database

**Problem**: No data found
- **Solution**: Verify you're connected to the correct database
- Check collection names match

### Import Issues

**Problem**: Duplicate key errors
- **Solution**: This is normal for unique fields (like phone numbers, MAC addresses)
- The script will skip duplicates automatically

**Problem**: Missing references (e.g., subscription references non-existent user)
- **Solution**: Make sure users are imported before subscriptions
- The script imports in the correct order automatically

**Problem**: Import fails partway through
- **Solution**: The script uses upsert for critical collections, so you can re-run it
- Check the error messages for specific issues

## 📝 Example Migration Session

```bash
# Step 1: Export from old database
$ export MONGO_URI="mongodb://old-connection-string"
$ node scripts/export-database.js

# Output:
# ✅ Connected to database successfully
# 📦 Exporting packages...
#    ✅ Found 5 packages document(s)
# 📦 Exporting users...
#    ✅ Found 12 users document(s)
#      - Admin users: 2
#      👤 Admin: John Doe (254712345678) - Email: admin@example.com
# ...

# Step 2: Update .env with new connection string
# Edit .env file: MONGO_URI=mongodb://new-connection-string

# Step 3: Import to new database
$ node scripts/import-database.js

# Output:
# ✅ Connected to new database successfully
# 📦 Importing packages...
#    ✅ Imported: 5, Skipped: 0, Errors: 0
# 📦 Importing users...
#    ✅ Imported: 12, Skipped: 0, Errors: 0
# ...
# ✅ Import completed successfully!
```

## ✅ Post-Migration Checklist

- [ ] All packages visible in admin panel
- [ ] Can log in with admin account
- [ ] User accounts accessible
- [ ] Subscriptions showing correctly
- [ ] Devices linked to users
- [ ] Vouchers working
- [ ] Payment records intact
- [ ] Points balances correct
- [ ] Application running normally

## 🆘 Need Help?

If you encounter issues:
1. Check the error messages in the console
2. Verify your `.env` file has the correct `MONGO_URI`
3. Ensure both databases are accessible
4. Check MongoDB connection logs
5. Review the export files to verify data was exported correctly


