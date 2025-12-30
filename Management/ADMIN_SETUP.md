# Admin User Setup Guide

## 🚀 Quick Admin Creation

### Method 1: Using the Script (Recommended)

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Run the Admin Creation Script:**
   ```bash
   cd Management
   node create-admin-simple.js
   ```

### Method 2: Manual API Call

If the script doesn't work, you can create an admin user manually:

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Make API Call:**
   ```bash
   curl -X POST http://localhost:3001/admin/auth/create-admin \
     -H "Content-Type: application/json" \
     -d '{
       "name": "System Administrator",
       "email": "admin@ecowifi.com",
       "password": "Admin123!@#"
     }'
   ```

### Method 3: Direct Database Creation

If you have access to the MongoDB database:

1. **Connect to MongoDB:**
   ```bash
   mongo
   use eco_wifi
   ```

2. **Create Admin User:**
   ```javascript
   db.users.insertOne({
     name: "System Administrator",
     email: "admin@ecowifi.com",
     phone: "0000000000",
     role: "admin",
     phoneVerified: true,
     createdAt: new Date()
   });
   ```

3. **Set Password (using bcrypt):**
   ```javascript
   const bcrypt = require('bcryptjs');
   const passwordHash = bcrypt.hashSync('Admin123!@#', 10);
   db.users.updateOne(
     { email: "admin@ecowifi.com" },
     { $set: { passwordHash: passwordHash } }
   );
   ```

## 🔑 Admin Login Credentials

Once the admin user is created, you can login to the management system with:

- **Email:** `admin@ecowifi.com`
- **Password:** `Admin123!@#`
- **Management URL:** `http://localhost:3002/`

## 🛠 Troubleshooting

### Backend Not Running
If you get a network error:
1. Make sure the backend is running on port 3001
2. Check the backend logs for any errors
3. Verify the database connection

### Admin Already Exists
If you get "Admin user already exists":
1. The admin user is already created
2. You can login with the credentials above
3. Or delete the existing admin and recreate

### Database Connection Issues
1. Check your MongoDB connection
2. Verify the database name in the backend configuration
3. Ensure the backend has proper environment variables

## 📋 Admin User Details

- **Name:** System Administrator
- **Email:** admin@ecowifi.com
- **Role:** admin
- **Status:** Active
- **Phone:** 0000000000 (placeholder)

## 🔐 Security Notes

- Change the default password after first login
- Use a strong, unique password
- Keep admin credentials secure
- Consider using environment variables for production

## 🚀 Next Steps

After creating the admin user:

1. **Start the Management System:**
   ```bash
   cd Management
   npm run dev
   ```

2. **Login to Management:**
   - Go to `http://localhost:3002/`
   - Click "Login"
   - Use the admin credentials

3. **Verify Access:**
   - You should see the dashboard
   - All management features should be accessible
   - Check that you can view users, devices, subscriptions, etc.

## 📞 Support

If you encounter any issues:
1. Check the backend logs
2. Verify the database connection
3. Ensure all environment variables are set
4. Check the network connectivity
