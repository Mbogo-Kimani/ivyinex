# ECO WIFI - Backend Documentation

## Overview
The ECO WIFI backend is a Node.js/Express API that manages a hotspot system with MikroTik router integration, M-Pesa payments via Safaricom Daraja API, and voucher-based access control. The system is designed for local WiFi hotspot businesses to provide internet access through prepaid packages.

## System Architecture

### Core Technologies
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Router Integration**: MikroTik RouterOS API (node-routeros)
- **Payment Processing**: Safaricom Daraja API (M-Pesa STK Push)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Logging**: Winston logger with MongoDB storage
- **Scheduling**: Cron jobs for cleanup tasks

### Project Structure
```
backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── jobs/
│   └── cleanup.js         # Scheduled cleanup of expired subscriptions
├── lib/
│   ├── daraja.js          # M-Pesa payment integration
│   ├── mikrotik.js        # RouterOS API integration
│   └── otp.js             # OTP generation utilities
├── logs/
│   └── app.log            # Application logs
├── models/
│   ├── Device.js          # Device management (currently empty)
│   ├── Log.js             # System logging model
│   ├── PackageModel.js    # Internet package definitions
│   ├── Payment.js         # Payment transaction records
│   ├── Subscription.js    # Active user subscriptions
│   ├── User.js            # User account management
│   └── Voucher.js         # Voucher system
├── routes/
│   ├── admin.js           # Admin panel endpoints
│   ├── auth.js            # User authentication
│   ├── checkout.js        # Payment processing
│   ├── devices.js         # Device management
│   ├── index.js           # Route aggregation
│   ├── packages.js        # Package catalog
│   └── vouchers.js        # Voucher redemption
├── utils/
│   └── logger.js          # Logging utilities
└── server.js              # Main application entry point
```

## Data Models

### User Model
- **Purpose**: User account management
- **Fields**: name, phone, email, passwordHash, phoneVerified, freeTrialUsed
- **Features**: Password hashing, phone verification tracking

### Package Model
- **Purpose**: Internet package catalog
- **Fields**: key, name, priceKES, durationSeconds, speedKbps, devicesAllowed
- **Usage**: Defines available internet packages with pricing and specifications

### Voucher Model
- **Purpose**: Voucher-based access system
- **Fields**: code, packageKey, valueKES, durationSeconds, uses, usedCount, soldBy, printed
- **Features**: Multi-use vouchers, usage tracking, seller attribution

### Subscription Model
- **Purpose**: Active user entitlements
- **Fields**: userId, packageKey, devices, startAt, endAt, active, mikrotikEntry, paymentId
- **Features**: Device binding, expiration tracking, router integration

### Payment Model
- **Purpose**: Transaction records
- **Fields**: userId, amountKES, provider, status, providerPayload
- **Features**: M-Pesa integration, payment status tracking

### Log Model
- **Purpose**: System activity logging
- **Fields**: level, source, message, metadata, createdAt
- **Features**: Structured logging with metadata support

## API Endpoints

### Authentication (`/api/auth`)
- User registration and login
- JWT token management
- Password hashing and verification

### Packages (`/api/packages`)
- `GET /` - Retrieve available packages catalog
- Sorted by price (ascending)

### Vouchers (`/api/vouchers`)
- `POST /redeem` - Redeem voucher code
  - **Body**: `{ code, mac, ip, userId? }`
  - **Response**: Subscription details
  - **Features**: Automatic MikroTik access grant

### Checkout (`/api/checkout`)
- `POST /start` - Initiate M-Pesa payment
  - **Body**: `{ phone, packageKey, mac, ip, userId? }`
  - **Response**: STK Push details
- `POST /daraja-callback` - M-Pesa payment callback
  - **Purpose**: Process payment completion
  - **Features**: Automatic subscription creation and access grant

### Admin (`/api/admin`)
- `GET /active-subscriptions` - View active subscriptions
- `GET /payments` - Payment history
- `GET /logs` - System logs with search
- `GET /vouchers` - Voucher management
- `POST /vouchers/create` - Generate new vouchers
  - **Body**: `{ packageKey, count }`

## Key Features

### 1. MikroTik Router Integration
- **Purpose**: Automatic access control on router
- **Method**: IP binding creation/removal
- **Features**: 
  - MAC address-based device identification
  - Time-based access control
  - Automatic cleanup of expired bindings

### 2. M-Pesa Payment Processing
- **Provider**: Safaricom Daraja API
- **Method**: STK Push for mobile payments
- **Features**:
  - Sandbox and production support
  - Automatic payment verification
  - Callback handling for payment completion

### 3. Voucher System
- **Purpose**: Alternative payment method
- **Features**:
  - Pre-generated voucher codes
  - Multi-use vouchers
  - Package-specific vouchers
  - Usage tracking and limits

### 4. Subscription Management
- **Purpose**: Track active user entitlements
- **Features**:
  - Device binding (MAC address)
  - Time-based expiration
  - Automatic cleanup
  - Payment association

### 5. Automated Cleanup
- **Purpose**: Remove expired access
- **Method**: Cron job (every minute)
- **Features**:
  - Expired subscription detection
  - MikroTik binding removal
  - Subscription status updates

## Current System State

### ✅ Implemented Features
1. **Core API Structure** - Complete Express.js setup with MongoDB
2. **User Management** - Registration, authentication, password handling
3. **Package System** - Catalog management with pricing and specifications
4. **Voucher System** - Generation, redemption, and usage tracking
5. **M-Pesa Integration** - STK Push implementation with callbacks
6. **MikroTik Integration** - Router access control via API
7. **Subscription Management** - Active entitlement tracking
8. **Admin Panel** - Basic administrative endpoints
9. **Logging System** - Comprehensive activity logging
10. **Automated Cleanup** - Expired subscription management

### ⚠️ Known Limitations
1. **Device Model** - Currently empty, needs implementation
2. **Payment Callback** - Uses fallback logic for package identification
3. **Admin Authentication** - No authentication on admin endpoints
4. **Error Handling** - Basic error handling, needs enhancement
5. **Rate Limiting** - No rate limiting implemented
6. **Input Validation** - Limited validation on API inputs

### 🔄 In Progress
1. **Payment Flow** - M-Pesa integration is functional but needs refinement
2. **Router Integration** - Basic functionality implemented, needs testing
3. **Voucher System** - Core functionality complete, needs admin UI

### 📋 Next Steps
1. Implement proper device management
2. Add comprehensive input validation
3. Implement admin authentication
4. Add rate limiting and security measures
5. Create comprehensive testing suite
6. Add monitoring and alerting
7. Implement backup and recovery procedures

## Environment Configuration

### Required Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/eco-wifi

# MikroTik Router
MI_HOST=192.168.88.1
MI_API_USER=admin
MI_API_PASS=password
MI_API_PORT=8728
MI_USE_SSL=false

# Safaricom Daraja
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your_passkey
DARAJA_CALLBACK_URL=http://your-domain.com/api/checkout/daraja-callback

# Server
PORT=5000
NODE_ENV=development
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update environment variables

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Security Considerations

### Current Security Measures
- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Input sanitization

### Security Improvements Needed
- Admin endpoint authentication
- Rate limiting implementation
- Input validation enhancement
- SQL injection prevention
- XSS protection
- CSRF protection

## Monitoring & Maintenance

### Logging
- All system activities logged to MongoDB
- Winston logger for application logs
- Error tracking and debugging support

### Cleanup Jobs
- Automated expired subscription cleanup
- Router binding management
- Log rotation (manual)

### Health Checks
- Basic health endpoint at `/`
- Database connection monitoring
- Router connectivity checks

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: Evo Tech Solutions