# IVYINEX Quick Reference Guide

## 🚀 Quick Start

### URLs
- **Frontend**: https://ivynex.vercel.app
- **Backend**: https://ivyinex.onrender.com
- **Health Check**: https://ivyinex.onrender.com/health

### Tech Stack
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: Next.js + React
- **Management**: React + Vite + Tailwind
- **Router**: MikroTik RouterOS (via Tailscale)
- **Payment**: M-Pesa Daraja API

---

## 📊 Key Data Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | phone, passwordHash, role, points, referralCode | User accounts |
| **Package** | key, name, priceKES, durationSeconds, speedKbps | Internet packages |
| **Subscription** | userId, packageKey, devices[], startAt, endAt, status | Active entitlements |
| **Payment** | userId, amountKES, provider, status | Transactions |
| **Voucher** | code, packageKey, uses, usedCount | Voucher codes |
| **Device** | mac, ip, userId, deviceType | Device tracking |

---

## 🔌 Essential API Endpoints

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login (phone/password)
GET  /api/auth/me          - Get current user
```

### Packages & Purchases
```
GET  /api/packages                    - List packages
POST /api/checkout/start              - Start M-Pesa payment
POST /api/vouchers/redeem            - Redeem voucher
POST /api/subscriptions/free-trial   - Claim free trial
```

### Subscriptions
```
GET  /api/subscriptions              - User subscriptions
POST /api/subscriptions/reconnect    - Reconnect device
GET  /api/subscriptions/:id          - Subscription details
```

### Points
```
GET  /api/points/balance             - Points balance
GET  /api/points/history             - Points history
POST /api/points/use                 - Use points
```

### Admin
```
GET  /api/admin/users                - List users
GET  /api/admin/devices              - List devices
GET  /api/admin/payments             - Payment history
GET  /api/admin/active-subscriptions - Active subscriptions
POST /api/admin/vouchers/create      - Create vouchers
```

---

## 🔐 Environment Variables

### Backend (Critical)
```env
MONGO_URI=mongodb+srv://...
MI_HOST=100.122.97.19
MI_API_USER=kim_admin
MI_API_PASS=@Newkim2025.
MI_API_PORT=8728
DARAJA_CONSUMER_KEY=...
DARAJA_CONSUMER_SECRET=...
DARAJA_SHORTCODE=174379
JWT_SECRET=...
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://ivyinex.onrender.com
```

---

## 🎨 Brand Colors

```css
--ivynex-primary: #21AFE9    /* Main blue */
--ivynex-accent: #2FE7F5     /* Cyan glow */
--ivynex-dark: #081425       /* Background */
--ivynex-panel: #1C3D50      /* Cards */
```

**Tagline**: "Fast. Reliable. Connected." or "Tap.Pay.Connect."

---

## 🔄 Key Workflows

### Purchase Flow
1. User selects package → Enters phone → STK Push → Payment → Subscription created → Access granted

### Voucher Flow
1. User enters code → Validation → Subscription created → Access granted

### Free Trial Flow
1. User claims trial → Device check → 1-hour subscription (2 Mbps) → Access granted

### Reconnection Flow
1. User connects → MAC captured → Active subscription found → Access granted

---

## 📁 Important Files

### Backend
- `server.js` - Main entry point
- `routes/index.js` - Route aggregation
- `lib/mikrotik.js` - Router integration
- `lib/daraja.js` - Payment integration
- `jobs/cleanup.js` - Expired subscription cleanup

### Frontend
- `pages/index.js` - Main landing page
- `pages/portal.js` - Captive portal
- `lib/api.js` - API client
- `styles/globals.css` - Brand styling

### Management
- `src/pages/Dashboard.jsx` - Analytics dashboard
- `src/pages/Users.jsx` - User management
- `src/pages/Devices.jsx` - Device management

---

## 🐛 Common Issues

### MikroTik Connection
- **Issue**: Connection timeout
- **Check**: Tailscale IP (100.122.97.19), firewall rules, API enabled
- **Logs**: Check backend logs for connection attempts

### Free Trial Not Working
- **Check**: Device MAC tracking, subscription creation, MikroTik access grant
- **Fix**: Ensure devices array populated in subscription

### Payment Callback
- **Check**: DARAJA_CALLBACK_URL configured correctly
- **Verify**: Callback endpoint accessible from Safaricom

---

## 📞 Support Resources

- **Backend Docs**: `backend/README.md`
- **Frontend Docs**: `frontend/README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Troubleshooting**: `backend/MIKROTIK_TROUBLESHOOTING.md`

---

## ⚡ Quick Commands

### Backend
```bash
npm start          # Production
npm run dev        # Development
```

### Frontend
```bash
npm run dev        # Development (port 3000)
npm run build      # Production build
```

### Management
```bash
npm run dev        # Development (port 3002)
npm run build      # Production build
```

---

## 🎯 System Status

✅ **Production Ready**
- Authentication ✅
- Payments ✅
- Vouchers ✅
- Free Trial ✅
- MikroTik Integration ✅
- Management Dashboard (Phase 4) ✅

---

**Last Updated**: December 2024

