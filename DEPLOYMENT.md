# Eco Wifi Deployment Guide

## Overview
This guide covers deploying the Eco Wifi hotspot system using:
- **Backend**: Render (Node.js/Express API)
- **Frontend**: Vercel (Next.js)
- **Database**: MongoDB Atlas or Render PostgreSQL

## Prerequisites
- GitHub repository with your code
- Render account
- Vercel account
- MongoDB Atlas account (or use Render's PostgreSQL)

## Backend Deployment (Render)

### 1. Connect Repository to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder as the root directory

### 2. Configure Render Service
- **Name**: `eco-wifi-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Starter (free) or higher for production

### 3. Environment Variables
Set these in Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eco-wifi
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRY=7d
MI_HOST=192.168.88.1
MI_API_USER=admin
MI_API_PASS=your-router-password
MI_API_PORT=8728
MI_USE_SSL=false
FRONTEND_URL=https://your-frontend.vercel.app
DARAJA_CONSUMER_KEY=your-daraja-key
DARAJA_CONSUMER_SECRET=your-daraja-secret
DARAJA_BASE_URL=https://api.safaricom.co.ke
DARAJA_CALLBACK_URL=https://your-backend.onrender.com/api/checkout/daraja-callback
```

### 4. Database Setup
**Option A: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster
3. Get connection string
4. Add to `MONGODB_URI` environment variable

**Option B: Render PostgreSQL**
1. Create PostgreSQL database in Render
2. Update connection string in environment variables

### 5. Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://eco-wifi-backend.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`

### 2. Configure Vercel Project
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3. Environment Variables
Set these in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### 4. Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://eco-wifi.vercel.app`)

## MikroTik Router Configuration

### 1. Update Router Settings
In your MikroTik router, configure:

```
/ip hotspot setup
# Set your domain
/ip hotspot profile set [find name="hsprof1"] html-directory-override=your-frontend.vercel.app
/ip hotspot profile set [find name="hsprof1"] http-proxy=0.0.0.0:0

# Configure login page
/ip hotspot profile set [find name="hsprof1"] login-by=http,https
/ip hotspot profile set [find name="hsprof1"] use-radius=no
```

### 2. Update Hotspot Server
```
/ip hotspot profile set [find name="hsprof1"] hotspot-address=your-backend.onrender.com
/ip hotspot profile set [find name="hsprof1"] http-proxy=your-backend.onrender.com:443
```

## Domain Configuration (Optional)

### 1. Custom Domain Setup
1. **Backend**: Add custom domain in Render
2. **Frontend**: Add custom domain in Vercel
3. **SSL**: Both platforms provide automatic SSL

### 2. DNS Configuration
Point your domain to:
- **Frontend**: Vercel's IP addresses
- **Backend**: Render's IP addresses

## Environment Variables Reference

### Backend (Render)
```env
# Required
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
FRONTEND_URL=https://your-frontend.vercel.app

# MikroTik
MI_HOST=192.168.88.1
MI_API_USER=admin
MI_API_PASS=your-password
MI_API_PORT=8728
MI_USE_SSL=false

# M-Pesa
DARAJA_CONSUMER_KEY=your-key
DARAJA_CONSUMER_SECRET=your-secret
DARAJA_BASE_URL=https://api.safaricom.co.ke
DARAJA_CALLBACK_URL=https://your-backend.onrender.com/api/checkout/daraja-callback
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## Monitoring and Maintenance

### 1. Render Monitoring
- View logs in Render dashboard
- Set up alerts for downtime
- Monitor resource usage

### 2. Vercel Monitoring
- View deployment logs
- Monitor performance
- Set up analytics

### 3. Database Monitoring
- Monitor MongoDB Atlas metrics
- Set up alerts for connection issues
- Regular backups

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check CORS configuration in backend

2. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` in frontend
   - Check backend URL is accessible

3. **MikroTik Connection Issues**
   - Verify router can reach backend URL
   - Check firewall settings
   - Ensure API credentials are correct

4. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network access in MongoDB Atlas
   - Ensure database user has correct permissions

### Debug Steps
1. Check Render logs for backend issues
2. Check Vercel logs for frontend issues
3. Test API endpoints directly
4. Verify environment variables
5. Check MikroTik router logs

## Security Considerations

### 1. Environment Variables
- Use strong, unique secrets
- Never commit secrets to repository
- Rotate secrets regularly

### 2. Database Security
- Use strong database passwords
- Enable network access restrictions
- Regular security updates

### 3. API Security
- Implement rate limiting
- Use HTTPS only
- Validate all inputs

## Scaling Considerations

### 1. Render Scaling
- Upgrade to higher plan for more resources
- Consider multiple instances for high traffic
- Monitor performance metrics

### 2. Vercel Scaling
- Vercel automatically scales
- Consider Edge Functions for global performance
- Monitor bandwidth usage

### 3. Database Scaling
- Upgrade MongoDB Atlas plan
- Consider read replicas
- Monitor query performance

## Backup Strategy

### 1. Database Backups
- Enable automatic backups in MongoDB Atlas
- Test restore procedures
- Store backups securely

### 2. Code Backups
- Use Git for version control
- Regular commits and pushes
- Tag releases for rollback capability

### 3. Configuration Backups
- Document all environment variables
- Backup MikroTik configuration
- Store deployment scripts

## Cost Optimization

### 1. Render Optimization
- Use appropriate plan for traffic
- Monitor resource usage
- Optimize code for performance

### 2. Vercel Optimization
- Use appropriate plan
- Optimize images and assets
- Monitor bandwidth usage

### 3. Database Optimization
- Use appropriate MongoDB plan
- Optimize queries
- Monitor storage usage

This deployment setup provides a robust, scalable solution for the Eco Wifi hotspot system with automatic scaling, SSL certificates, and global CDN distribution.
