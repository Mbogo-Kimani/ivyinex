/**
 * Portal Data Management Utility
 * Handles MAC/IP capture and persistence across navigation
 */

const PORTAL_DATA_KEY = 'eco.portalData';

/**
 * Get portal data from sessionStorage
 * @returns {Object|null} Portal data object with mac and ip
 */
export function getPortalData() {
    if (typeof window === 'undefined') return null;

    try {
        const stored = sessionStorage.getItem(PORTAL_DATA_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (err) {
        console.error('Failed to get portal data from sessionStorage:', err);
        return null;
    }
}

/**
 * Set portal data in sessionStorage
 * @param {Object} data - Portal data object with mac and ip
 */
export function setPortalData(data) {
    if (typeof window === 'undefined') return;

    try {
        if (data && (data.mac || data.ip)) {
            sessionStorage.setItem(PORTAL_DATA_KEY, JSON.stringify(data));
        } else {
            sessionStorage.removeItem(PORTAL_DATA_KEY);
        }
    } catch (err) {
        console.error('Failed to set portal data in sessionStorage:', err);
    }
}

/**
 * Clear portal data from sessionStorage
 */
export function clearPortalData() {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.removeItem(PORTAL_DATA_KEY);
    } catch (err) {
        console.error('Failed to clear portal data from sessionStorage:', err);
    }
}

/**
 * Capture portal data from URL query parameters
 * @returns {Object|null} Portal data object with mac, ip, and MikroTik parameters
 */
export function capturePortalDataFromURL() {
    if (typeof window === 'undefined') return null;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const portalData = {
            mac: urlParams.get('mac'),
            ip: urlParams.get('ip'),
            chapId: urlParams.get('chap-id'),
            chapChallenge: urlParams.get('chap-challenge'),
            linkLogin: urlParams.get('link-login'),
            linkOrig: urlParams.get('link-orig'),
            username: urlParams.get('username'),
            password: urlParams.get('password'),
            error: urlParams.get('error')
        };

        // Only store if we have meaningful data
        if (portalData.mac || portalData.ip || portalData.chapId) {
            setPortalData(portalData);
            return portalData;
        }

        return null;
    } catch (err) {
        console.error('Failed to capture portal data from URL:', err);
        return null;
    }
}

/**
 * Check if portal data exists
 * @returns {boolean} True if portal data exists
 */
export function hasPortalData() {
    const data = getPortalData();
    return data && (data.mac || data.ip);
}

/**
 * Get MAC address from portal data
 * @returns {string|null} MAC address or null
 */
export function getMacAddress() {
    const data = getPortalData();
    return data?.mac || null;
}

/**
 * Get IP address from portal data
 * @returns {string|null} IP address or null
 */
export function getIpAddress() {
    const data = getPortalData();
    return data?.ip || null;
}





