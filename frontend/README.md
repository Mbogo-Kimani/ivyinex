# ECO WIFI - Frontend Documentation

## Overview
The ECO WIFI frontend is a Next.js React application that provides the user interface for a hotspot portal system. It enables users to browse internet packages, redeem vouchers, and access the system through a captive portal. The frontend is designed to work seamlessly with the backend API to provide a complete hotspot management solution.

## System Architecture

### Core Technologies
- **Framework**: Next.js 13.5.6 with React 18.2.0
- **Styling**: CSS with custom design system
- **State Management**: React hooks (useState, useEffect)
- **API Integration**: Custom API client with fetch
- **Routing**: Next.js file-based routing

### Project Structure
```
frontend/
├── components/
│   ├── CheckoutModal.js    # Package purchase/voucher redemption modal
│   ├── Header.js           # Navigation header component
│   ├── PackageCard.js      # Individual package display card
│   └── VoucherModal.js     # Voucher redemption modal
├── lib/
│   └── api.js              # Backend API client functions
├── pages/
│   ├── _app.js             # Next.js app wrapper
│   ├── ads.js              # Post-authentication landing page
│   ├── index.js            # Main package selection page
│   └── portal.js           # Captive portal landing page
├── styles/
│   └── globals.css         # Global styles and design system
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## Page Structure

### 1. Main Page (`/` - index.js)
**Purpose**: Primary landing page for package selection and voucher redemption

**Features**:
- Package catalog display with pricing and specifications
- Voucher redemption functionality
- Captive portal data capture (MAC/IP from query parameters)
- Responsive grid layout for packages
- Hero section with branding and call-to-action

**User Flow**:
1. User visits page (directly or from captive portal)
2. System auto-detects MAC/IP if coming from captive portal
3. User can browse available packages
4. User can redeem vouchers for specific packages
5. After successful redemption, redirects to ads page

**Key Components**:
- `Header` - Navigation and voucher access
- `PackageCard` - Individual package display
- `CheckoutModal` - Package-specific voucher redemption
- `VoucherModal` - General voucher redemption guidance

### 2. Captive Portal Page (`/portal` - portal.js)
**Purpose**: Landing page for users redirected from MikroTik captive portal

**Features**:
- MAC and IP address display
- Quick access to package browsing
- Voucher redemption access
- Payment status information

**User Flow**:
1. MikroTik router redirects user with MAC/IP parameters
2. Page displays device information
3. User chooses to browse packages or redeem voucher
4. Redirects to main page with captured data

### 3. Ads Page (`/ads` - ads.js)
**Purpose**: Post-authentication landing page for connected users

**Features**:
- Promotional content display
- Community announcements
- Partner advertisements
- Revenue generation through ad space

**Content**:
- Back-to-school promotions
- Local vendor partnerships
- Community notices
- Admin-manageable content (future enhancement)

## Component Architecture

### 1. Header Component
**Purpose**: Navigation and branding
**Features**:
- Eco Wifi branding
- Voucher redemption button
- Portal data display (when available)
- Responsive design

### 2. PackageCard Component
**Purpose**: Individual package display and interaction
**Features**:
- Package details (name, price, duration, speed)
- Purchase button (currently disabled for M-Pesa)
- Voucher redemption trigger
- Responsive card layout

### 3. CheckoutModal Component
**Purpose**: Package-specific voucher redemption
**Features**:
- Voucher code input
- Package information display
- MAC/IP auto-population from portal data
- Success/error message handling
- Form validation

### 4. VoucherModal Component
**Purpose**: General voucher redemption guidance
**Features**:
- Instructions for voucher redemption
- Package selection guidance
- User-friendly interface

## API Integration

### API Client (`lib/api.js`)
**Purpose**: Centralized backend communication

**Functions**:
- `fetchPackages()` - Retrieve available packages
- `startCheckout(payload)` - Initiate M-Pesa payment
- `redeemVoucher(payload)` - Redeem voucher code

**Configuration**:
- Backend URL configuration via environment variables
- Error handling and response processing
- JSON payload formatting

## Design System

### Color Palette
- **Primary Brand**: Green gradient (`--brand-1`, `--brand-2`)
- **Accent**: Complementary accent color (`--accent`)
- **Neutral**: Grays for text and backgrounds
- **Status**: Success (green), error (red), warning (yellow)

### Typography
- **Headings**: Bold, hierarchical sizing
- **Body Text**: Readable font with proper line height
- **Labels**: Small, descriptive text (`kv` class)

### Layout System
- **Container**: Centered, max-width container
- **Grid**: Responsive package grid layout
- **Spacing**: Consistent margin and padding system
- **Cards**: Rounded corners, subtle shadows

### Interactive Elements
- **Buttons**: Primary, secondary, and ghost variants
- **Inputs**: Styled form inputs with focus states
- **Modals**: Backdrop with centered content
- **Toast**: Temporary notification system

## User Experience Features

### 1. Captive Portal Integration
- **Auto-detection**: MAC/IP capture from URL parameters
- **Seamless flow**: Automatic data passing between pages
- **Device identification**: Clear display of device information

### 2. Voucher System
- **Multiple entry points**: Package-specific and general redemption
- **Auto-population**: Device data automatically filled
- **Validation**: Real-time form validation
- **Feedback**: Clear success/error messages

### 3. Package Selection
- **Visual hierarchy**: Clear pricing and feature display
- **Responsive design**: Works on all device sizes
- **Loading states**: Smooth loading indicators
- **Error handling**: Graceful error recovery

### 4. Navigation
- **Intuitive flow**: Clear user journey
- **Breadcrumbs**: Easy navigation between pages
- **Call-to-action**: Prominent action buttons

## Current System State

### ✅ Implemented Features
1. **Core Pages** - Main, portal, and ads pages
2. **Package Display** - Catalog with pricing and features
3. **Voucher System** - Redemption with device binding
4. **Captive Portal** - MAC/IP capture and display
5. **Responsive Design** - Mobile-friendly interface
6. **API Integration** - Backend communication
7. **Modal System** - Checkout and voucher modals
8. **Error Handling** - User feedback system
9. **Loading States** - Smooth user experience
10. **Design System** - Consistent styling

### ⚠️ Known Limitations
1. **M-Pesa Integration** - Payment buttons disabled in UI
2. **Admin Interface** - No admin panel for content management
3. **User Authentication** - No user login/registration UI
4. **Package Management** - No dynamic package creation
5. **Voucher Management** - No voucher generation UI
6. **Analytics** - No user behavior tracking
7. **Offline Support** - No offline functionality
8. **PWA Features** - No progressive web app features

### 🔄 In Progress
1. **Payment Flow** - M-Pesa integration ready but disabled
2. **Content Management** - Ads page ready for dynamic content
3. **User Experience** - Smooth transitions and feedback

### 📋 Next Steps
1. Enable M-Pesa payment integration
2. Create admin interface for content management
3. Add user authentication UI
4. Implement package management interface
5. Add voucher generation and management
6. Implement analytics and tracking
7. Add offline support and PWA features
8. Enhance mobile experience
9. Add accessibility features
10. Implement testing suite

## Configuration

### Environment Variables
```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

### Next.js Configuration
- **Port**: 3000 (development)
- **Build**: Production-ready build system
- **Routing**: File-based routing system

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Set backend URL in environment variables

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Browser Support

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Performance Considerations

### Current Optimizations
- Next.js automatic code splitting
- CSS optimization
- Image optimization (when added)
- Bundle size optimization

### Performance Improvements Needed
- Image lazy loading
- Code splitting optimization
- Caching strategies
- CDN integration
- Performance monitoring

## Security Considerations

### Current Security Measures
- Input sanitization
- XSS prevention
- CSRF protection (Next.js built-in)
- Secure API communication

### Security Improvements Needed
- Content Security Policy
- Input validation enhancement
- Rate limiting
- Authentication security
- Data encryption

## Accessibility

### Current Accessibility Features
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Accessibility Improvements Needed
- ARIA labels and roles
- Focus management
- Alternative text for images
- Keyboard shortcuts
- High contrast mode

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: Evo Tech Solutions






















