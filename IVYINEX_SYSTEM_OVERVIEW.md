# IVYINEX System - Comprehensive Overview

## 📋 Executive Summary

**IVYINEX** (formerly Eco Wifi) is a comprehensive WiFi hotspot management system designed for local ISP businesses. The system provides internet access through prepaid packages, voucher redemption, and free trial options, with full integration to MikroTik routers and M-Pesa payment processing.

**Current Status**: Production-ready, deployed and operational
- **Frontend**: https://ivynex.vercel.app
- **Backend**: https://ivyinex.onrender.com
- **Management Dashboard**: React-based admin panel (Phase 4 complete)

---

## 🏗️ System Architecture

### Three-Tier Architecture

1. **Backend** (Node.js/Express)
   - RESTful API server
   - MongoDB database
   - MikroTik RouterOS integration
   - M-Pesa Daraja API integration
   - Deployed on Render

2. **Frontend** (Next.js/React)
   - User-facing captive portal
   - Package selection and purchase
   - Voucher redemption
   - User account management
   - Deployed on Vercel

3. **Management Dashboard** (React/Vite)
   - Admin panel for system management
   - Analytics and reporting
   - User, device, and subscription management
   - Real-time monitoring

---

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt
- **Router Integration**: node-routeros (MikroTik RouterOS API)
- **Payment**: Safaricom Daraja API (M-Pesa STK Push)
- **Logging**: Winston logger with MongoDB storage
- **Scheduling**: Cron jobs for cleanup tasks

### Frontend
- **Framework**: Next.js 13.5.6 with React 18.2.0
- **Styling**: Custom CSS with Ivynex brand colors
- **State Management**: React Context API
- **API Integration**: Custom fetch-based API client

### Management Dashboard
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with React Chart.js 2
- **State Management**: React Query, Context API
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client

---

## 📊 Data Models

### User Model
- **Fields**: name, phone, email, passwordHash, role, phoneVerified, freeTrialUsed
- **Features**: 
  - Password hashing with bcrypt
  - Points system (balance, referral code, referral tracking)
  - Role-based access (user/admin)
  - Phone verification tracking

### Package Model
- **Fields**: key, name, priceKES, durationSeconds, speedKbps, devicesAllowed
- **Features**:
  - Points-based purchase (pointsRequired, pointsEarned)
  - Package catalog management
  - Speed and duration specifications

### Subscription Model
- **Fields**: userId, deviceId, packageKey, devices[], startAt, endAt, status, active
- **Features**:
  - Device binding (MAC addresses)
  - Time-based expiration
  - Payment association
  - MikroTik router entry tracking
  - Status management (active/expired/cancelled)

### Payment Model
- **Fields**: userId, amountKES, provider, status, providerPayload
- **Features**:
  - M-Pesa transaction tracking
  - Payment status management
  - Provider payload storage

### Voucher Model
- **Fields**: code, packageKey, valueKES, durationSeconds, uses, usedCount, soldBy, printed
- **Features**:
  - Multi-use vouchers
  - Usage tracking
  - Seller attribution
  - Package-specific vouchers

### Device Model
- **Fields**: mac, ip, userId, deviceType, lastSeen, status
- **Features**:
  - Device type detection (mobile, desktop, tablet)
  - Activity tracking
  - User association

### Log Model
- **Fields**: level, source, message, metadata, createdAt
- **Features**:
  - Structured logging
  - Metadata support
  - System activity tracking

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login (phone/password)
- `GET /me` - Get current user
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password

### Packages (`/api/packages`)
- `GET /` - Get available packages (sorted by price)

### Vouchers (`/api/vouchers`)
- `POST /redeem` - Redeem voucher code
  - Body: `{ code, mac, ip, userId? }`
  - Auto-grants MikroTik access

### Checkout (`/api/checkout`)
- `POST /start` - Initiate M-Pesa STK Push
  - Body: `{ phone, packageKey, mac, ip, userId? }`
- `POST /daraja-callback` - M-Pesa payment callback
  - Auto-creates subscription and grants access

### Subscriptions (`/api/subscriptions`)
- `GET /` - Get user subscriptions
- `GET /:id` - Get subscription details
- `POST /free-trial` - Claim free trial
- `POST /reconnect` - Reconnect device with active subscription
- `POST /:id/devices` - Add device to subscription
- `PUT /:id/devices/:deviceId` - Update device
- `DELETE /:id/devices/:deviceId` - Remove device

### Devices (`/api/devices`)
- Device management endpoints

### Points (`/api/points`)
- `GET /balance` - Get user points balance
- `GET /history` - Get points transaction history
- `POST /use` - Use points for purchase
- `GET /referral-code` - Get user referral code
- `POST /referral` - Process referral

### Admin (`/api/admin`)
- `GET /active-subscriptions` - View active subscriptions
- `GET /payments` - Payment history
- `GET /logs` - System logs with search
- `GET /vouchers` - Voucher management
- `POST /vouchers/create` - Generate new vouchers
- `GET /users` - User management
- `GET /devices` - Device management
- `GET /system/health` - System health check

### MikroTik (`/api/mikrotik`)
- `GET /test` - Test MikroTik connection
- `POST /capture-device` - Capture device info
- `POST /login` - Grant access via MikroTik

---

## 🎨 Branding & Design

### Brand Identity
- **Name**: Ivynex (rebranded from Eco Wifi)
- **Tagline**: "Fast. Reliable. Connected."
- **Alternative Tagline**: "Tap.Pay.Connect."

### Color Scheme
- **Primary**: `#21AFE9` (Main brand blue)
- **Accent**: `#2FE7F5` (Cyan highlights/glow)
- **Secondary**: `#1B7899` (Supporting blue)
- **Dark**: `#081425` (Main background)
- **Panel**: `#1C3D50` (Cards/navbar)
- **Muted**: `#717982` (Secondary text)

### Design Theme
- **Style**: Modern dark-mode ISP aesthetic
- **Gradients**: Blue-to-cyan gradients for primary elements
- **Effects**: Glow effects on hover/focus states
- **Layout**: Centered, minimal, mobile-friendly

---

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Bcrypt password hashing (salt rounds: 10)
- Phone-based login system
- Role-based access control (user/admin)

### API Security
- CORS configuration with specific allowed origins
- JWT token validation middleware
- Input sanitization
- Error handling without exposing sensitive data

### Security Improvements Needed
- Admin endpoint authentication (currently unprotected)
- Rate limiting implementation
- Enhanced input validation
- CSRF protection
- Content Security Policy

---

## 🌐 Integration Details

### MikroTik Router Integration
- **Connection**: Via Tailscale (IP: 100.122.97.19:8728)
- **Method**: RouterOS API (node-routeros library)
- **Operations**:
  - IP binding creation (bypass mode)
  - IP binding removal
  - Automatic access grant/revoke
- **Features**:
  - Retry logic (3 attempts with exponential backoff)
  - Connection timeout handling (15 seconds)
  - Comprehensive error logging
  - MAC address-based device identification

### M-Pesa Integration
- **Provider**: Safaricom Daraja API
- **Method**: STK Push for mobile payments
- **Features**:
  - Phone number normalization (254XXXXXXXXX format)
  - Automatic payment verification
  - Callback handling for payment completion
  - Sandbox and production support
- **Environment Variables**:
  - `DARAJA_CONSUMER_KEY`
  - `DARAJA_CONSUMER_SECRET`
  - `DARAJA_SHORTCODE`
  - `DARAJA_PASSKEY`
  - `DARAJA_CALLBACK_URL`
  - `DARAJA_BASE_URL`

---

## 🎯 Key Features

### 1. Free Trial System
- **Speed**: 2 Mbps
- **Duration**: 1 hour (3600 seconds)
- **Limitation**: One free trial per device (MAC address)
- **Implementation**: Device-based tracking
- **Auto-reconnection**: Devices with active free trial subscriptions auto-reconnect

### 2. Points & Referral System
- **Points Balance**: Users earn and spend points
- **Referral Codes**: Unique 8-character codes per user
- **Referral Rewards**: Points for successful referrals
- **Points Purchase**: Packages can be purchased with points
- **Points History**: Transaction tracking

### 3. Voucher System
- **Pre-generated Codes**: Admin can create vouchers
- **Multi-use Vouchers**: Support for multiple redemptions
- **Package-specific**: Vouchers tied to specific packages
- **Usage Tracking**: Monitor voucher usage and limits
- **Seller Attribution**: Track who sold vouchers

### 4. Subscription Management
- **Device Binding**: MAC address-based device association
- **Time-based Expiration**: Automatic cleanup of expired subscriptions
- **Status Tracking**: Active/expired/cancelled status
- **Reconnection**: Auto-reconnect devices with active subscriptions
- **Multi-device Support**: Packages can allow multiple devices

### 5. Automated Cleanup
- **Cron Job**: Runs every minute
- **Functions**:
  - Detects expired subscriptions
  - Removes MikroTik bindings
  - Updates subscription status
  - Cleans up inactive entries

### 6. User Account Management
- **Profile Management**: Update name, email, phone
- **Password Management**: Change password functionality
- **Device Management**: View and manage connected devices
- **Subscription History**: View past and active subscriptions
- **Points Dashboard**: View balance and history

---

## 📱 Frontend Pages

### Public Pages
1. **`/` (index.js)** - Main landing page
   - Package catalog display
   - Voucher redemption
   - Free trial banner
   - Portal data capture

2. **`/portal`** - Captive portal landing
   - MAC/IP address display
   - Quick access to packages
   - Device information

3. **`/ads`** - Post-authentication page
   - Promotional content
   - Community announcements
   - Partner advertisements

### Authentication Pages
4. **`/auth/login`** - User login
5. **`/auth/register`** - User registration

### Account Pages (Protected)
6. **`/account`** - Account dashboard
   - Subscription overview
   - Points balance
   - Quick actions

7. **`/account/profile`** - Profile management
8. **`/account/settings`** - Account settings
9. **`/account/devices`** - Device management
10. **`/account/subscriptions`** - Subscription list
11. **`/account/subscriptions/[id]`** - Subscription details
12. **`/account/free-trial`** - Free trial claim page

---

## 🖥️ Management Dashboard

### Current Status: Phase 4 Complete ✅

**Completed Phases**:
- ✅ Phase 1: Project Setup & Core Infrastructure
- ✅ Phase 2: Dashboard & Analytics
- ✅ Phase 3: User Management
- ✅ Phase 4: Device Management

**Next Phase**: Phase 5 - Subscription Management

### Features Implemented

#### Dashboard & Analytics
- Real-time statistics
- Revenue analytics with Chart.js
- User analytics (growth and activity)
- Device analytics (connection monitoring)
- System health indicators
- Recent activity feeds

#### User Management
- Advanced user list with search/filter/sort
- User details modal
- In-place editing with validation
- Bulk operations
- Status management
- User actions (view, edit, delete)

#### Device Management
- Smart device type detection
- Device list with filtering
- Device details view
- Device editing
- Activity tracking
- Device actions (block, unblock, delete)

### Technology
- React 18, Vite, Tailwind CSS
- React Query for data fetching
- Chart.js for visualizations
- Socket.io for real-time updates
- Axios for API calls

---

## 🚀 Deployment Configuration

### Backend (Render)
- **Service**: Web Service
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 5000 (or from env)
- **Environment**: Production
- **Database**: MongoDB Atlas

### Frontend (Vercel)
- **Framework**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Port**: 3000

### Environment Variables

#### Backend (Required)
```env
# Database
MONGO_URI=mongodb+srv://...

# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret
JWT_EXPIRY=7d

# MikroTik
MI_HOST=100.122.97.19
MI_API_USER=kim_admin
MI_API_PASS=@Newkim2025.
MI_API_PORT=8728
MI_USE_SSL=false

# M-Pesa Daraja
DARAJA_CONSUMER_KEY=your-key
DARAJA_CONSUMER_SECRET=your-secret
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=your-passkey
DARAJA_BASE_URL=https://api.safaricom.co.ke
DARAJA_CALLBACK_URL=https://ivyinex.onrender.com/api/checkout/daraja-callback

# Frontend
FRONTEND_URL=https://ivynex.vercel.app
```

#### Frontend (Required)
```env
NEXT_PUBLIC_API_URL=https://ivyinex.onrender.com
BACKEND_URL=https://ivyinex.onrender.com
```

---

## 📁 Project Structure

```
IVYINEX/
├── backend/                    # Node.js/Express API
│   ├── config/                 # Database configuration
│   ├── jobs/                   # Scheduled tasks (cleanup)
│   ├── lib/                    # Core libraries
│   │   ├── daraja.js          # M-Pesa integration
│   │   ├── mikrotik.js        # RouterOS API
│   │   └── otp.js             # OTP utilities
│   ├── middleware/             # Auth middleware
│   ├── models/                 # MongoDB models (8 models)
│   ├── routes/                 # API routes (10 route files)
│   ├── scripts/                # Database migration scripts
│   ├── utils/                  # Utilities (logger)
│   ├── server.js               # Main entry point
│   └── package.json
│
├── frontend/                   # Next.js user portal
│   ├── components/             # React components
│   ├── contexts/               # React contexts (Auth, Toast)
│   ├── lib/                    # API client, validation
│   ├── pages/                  # Next.js pages
│   │   ├── account/           # Protected account pages
│   │   └── auth/              # Login/register
│   ├── styles/                 # Global CSS
│   └── package.json
│
├── Management/                 # React admin dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Dashboard pages
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utilities
│   └── package.json
│
└── Documentation files
    ├── README.md
    ├── DEPLOYMENT.md
    ├── IVYNEX_REBRANDING_CHANGES.md
    └── URL_MIGRATION_SUMMARY.md
```

---

## 🔄 System Workflows

### User Registration Flow
1. User visits frontend
2. Clicks register, fills form (name, phone, email, password)
3. Backend creates user with hashed password
4. JWT token returned
5. User logged in automatically

### Package Purchase Flow (M-Pesa)
1. User selects package
2. Enters phone number
3. Backend initiates STK Push via Daraja API
4. User receives M-Pesa prompt on phone
5. User approves payment
6. Daraja sends callback to backend
7. Backend creates subscription
8. MikroTik access granted automatically
9. User redirected to success page

### Voucher Redemption Flow
1. User enters voucher code
2. Backend validates voucher
3. Checks usage limits
4. Creates subscription
5. Grants MikroTik access
6. Updates voucher usage count
7. Returns success response

### Free Trial Flow
1. User clicks "Claim Free Trial"
2. System checks if device (MAC) already used free trial
3. If not, creates 1-hour subscription (2 Mbps)
4. Grants MikroTik access
5. Tracks device MAC for future prevention

### Auto-Reconnection Flow
1. User with active subscription connects to hotspot
2. Portal captures MAC/IP
3. Frontend calls reconnect API
4. Backend finds active subscription by MAC
5. Grants MikroTik access
6. User gets internet automatically

---

## 📊 Database Schema Summary

### Collections
1. **users** - User accounts
2. **packages** - Internet package catalog
3. **subscriptions** - Active user entitlements
4. **payments** - Payment transactions
5. **vouchers** - Voucher codes
6. **devices** - Device records
7. **logs** - System activity logs
8. **points** - Points transactions (if separate collection)

### Relationships
- User → Subscriptions (one-to-many)
- User → Payments (one-to-many)
- User → Devices (one-to-many)
- Subscription → Package (many-to-one)
- Subscription → Payment (many-to-one)
- Subscription → Device (many-to-one)

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Device Model**: Currently minimal implementation
2. **Admin Authentication**: Admin endpoints not protected
3. **Rate Limiting**: Not implemented
4. **Input Validation**: Limited validation on some endpoints
5. **Error Handling**: Basic error handling, needs enhancement
6. **Payment Callback**: Uses fallback logic for package identification

### Areas for Improvement
1. Comprehensive testing suite
2. Monitoring and alerting
3. Backup and recovery procedures
4. Enhanced security measures
5. Performance optimization
6. Analytics and reporting enhancements

---

## 📈 System Metrics & Monitoring

### Logging
- **Backend**: Winston logger with MongoDB storage
- **Log Levels**: info, warn, error
- **Log Sources**: mikrotik, daraja, auth, api, etc.
- **Log Storage**: MongoDB Log collection

### Health Checks
- **Backend**: `/health` endpoint
  - Status, uptime, memory usage
- **Frontend**: Basic health indicators
- **Database**: Connection status monitoring

### Monitoring Points
- MikroTik connection status
- Database connection health
- Payment callback success rate
- Subscription expiration cleanup
- Free trial usage tracking

---

## 🔧 Maintenance & Operations

### Scheduled Jobs
- **Cleanup Job**: Runs every minute
  - Removes expired subscriptions
  - Revokes MikroTik access
  - Updates subscription status

### Database Maintenance
- **Export Scripts**: Available in `backend/scripts/`
- **Import Scripts**: Database migration tools
- **View Scripts**: Database info utilities

### Backup Strategy
- MongoDB Atlas automatic backups (if using Atlas)
- Manual export scripts available
- Database exports stored in `backend/database-exports/`

---

## 🎓 Development Guidelines

### Code Style
- JavaScript (ES6+)
- Async/await for asynchronous operations
- Error handling with try/catch
- Comprehensive logging

### Best Practices
- Environment variables for configuration
- JWT for authentication
- Bcrypt for password hashing
- Mongoose for database operations
- Express middleware for request handling

### Testing
- Manual testing procedures documented
- API endpoint testing scripts available
- Browser testing tools in Management folder

---

## 📞 Support & Documentation

### Key Documentation Files
- `README.md` - Main project overview
- `backend/README.md` - Backend documentation
- `frontend/README.md` - Frontend documentation
- `Management/README.md` - Management dashboard docs
- `DEPLOYMENT.md` - Deployment guide
- `IVYNEX_REBRANDING_CHANGES.md` - Branding changes
- `URL_MIGRATION_SUMMARY.md` - URL migration details

### Troubleshooting Guides
- `backend/MIKROTIK_TROUBLESHOOTING.md`
- `backend/FREE_TRIAL_FIX_SUMMARY.md`
- `backend/DEPLOYMENT_CHECKLIST.md`

---

## 🚦 Current System Status

### ✅ Production Ready Features
- User authentication and registration
- Package catalog management
- M-Pesa payment integration
- Voucher system
- Free trial system
- MikroTik router integration
- Subscription management
- Points and referral system
- Device management
- Admin dashboard (Phase 4)
- Automated cleanup jobs
- Comprehensive logging

### 🔄 In Progress
- Subscription management UI (Management dashboard Phase 5)
- Enhanced admin features
- Additional analytics

### 📋 Planned Enhancements
- Package management UI
- Enhanced voucher management
- Payment management interface
- Advanced analytics
- Mobile app (potential)
- SMS notifications (potential)

---

## 🌍 URLs & Domains

### Production URLs
- **Frontend**: https://ivynex.vercel.app
- **Backend**: https://ivyinex.onrender.com
- **Management**: (Local development or separate deployment)

### CORS Configuration
- Frontend URL allowed in backend CORS
- Localhost URLs allowed for development
- Credentials enabled for authenticated requests

---

## 📝 Important Notes

1. **Brand Name**: System rebranded from "Eco Wifi" to "Ivynex"
2. **Tailscale**: MikroTik connection uses Tailscale VPN (100.122.97.19)
3. **Free Trial**: Limited to one per device (MAC address)
4. **Session Storage**: Uses 'eco.' prefix for compatibility
5. **API Proxying**: Frontend proxies API calls through `/api/*` routes
6. **Environment**: Production environment configured and deployed

---

**Last Updated**: December 2024  
**System Version**: 1.0.1  
**Status**: Production Ready ✅

