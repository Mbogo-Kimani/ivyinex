# MikroTik Connection Troubleshooting Guide

## Current Issue: RouterOS API Connection Failures

The logs show `RosException` errors when trying to connect to the MikroTik router at `100.122.97.19:8728`. This indicates the connection is being established but the RouterOS API is rejecting the connection.

## Possible Causes & Solutions

### 1. **Tailscale Connectivity Issues**
**Problem**: Render deployment cannot reach the MikroTik router via Tailscale.

**Solutions**:
- Verify Tailscale is running on the MikroTik router
- Check if the Render server is connected to the same Tailscale network
- Test connectivity: `ping 100.122.97.19` from Render console

### 2. **RouterOS API Not Enabled**
**Problem**: The API service is not enabled on the MikroTik router.

**Solutions**:
- SSH into the router: `ssh admin@100.122.97.19`
- Enable API: `/ip service set api disabled=no`
- Set API port: `/ip service set api port=8728`
- Allow API from specific IPs: `/ip firewall filter add chain=input action=accept protocol=tcp dst-port=8728 src-address=YOUR_RENDER_IP`

### 3. **Authentication Issues**
**Problem**: Username/password incorrect or user lacks API permissions.

**Solutions**:
- Verify credentials in environment variables
- Check if user `kim_admin` exists and has API permissions
- Test login manually: `telnet 100.122.97.19 8728`

### 4. **Firewall Blocking**
**Problem**: Router firewall is blocking connections from Render.

**Solutions**:
- Add firewall rule: `/ip firewall filter add chain=input action=accept protocol=tcp dst-port=8728`
- Check existing rules: `/ip firewall filter print`

### 5. **Network Routing Issues**
**Problem**: Tailscale routing is not working properly.

**Solutions**:
- Check Tailscale status: `tailscale status`
- Verify subnet routes: `tailscale status --json`
- Restart Tailscale service if needed

## Diagnostic Steps

### Step 1: Test Network Connectivity
```bash
# From Render console or local machine
telnet 100.122.97.19 8728
```

### Step 2: Test RouterOS API Manually
```bash
# Using RouterOS API client
node -e "
const { RouterOSAPI } = require('node-routeros');
const conn = new RouterOSAPI({
  host: '100.122.97.19',
  user: 'kim_admin',
  password: '@Newkim2025.',
  port: 8728
});
conn.connect().then(() => console.log('Connected!')).catch(console.error);
"
```

### Step 3: Check Router Configuration
```bash
# SSH into router and check:
/ip service print
/ip firewall filter print
/user print
```

## Immediate Workarounds

### Option 1: Manual Router Configuration
If the API connection continues to fail, you can manually configure the router:

1. SSH into the MikroTik router
2. Add IP binding manually:
```bash
/ip hotspot ip-binding add mac-address=AA:BB:CC:DD:EE:FF address=192.168.1.100 type=bypassed comment="manual-reconnect"
```

### Option 2: Alternative Connection Method
Consider using:
- SSH instead of API
- SNMP for device management
- Web-based configuration

### Option 3: Local Proxy
Set up a local proxy server that can reach the MikroTik router and forward API calls.

## Environment Variables Check

Current configuration:
```
MI_HOST=100.122.97.19
MI_API_USER=kim_admin
MI_API_PASS=@Newkim2025.
MI_API_PORT=8728
MI_USE_SSL=false
```

## Next Steps

1. **Run the diagnostic tool**: `node test-mikrotik-connection.js`
2. **Check Tailscale connectivity** from Render
3. **Verify RouterOS API is enabled** on the router
4. **Test manual connection** using the credentials
5. **Consider alternative connection methods** if API continues to fail

## Support Information

If the issue persists:
- Check Render deployment logs for more details
- Verify Tailscale network configuration
- Test from a different network to isolate the issue
- Consider using a different connection method (SSH, SNMP, etc.)
