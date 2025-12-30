/**
 * Form Validation Utilities
 * Comprehensive validation functions for all form inputs
 */

// MAC address validation regex
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

// Phone validation for Kenya (supports 254, +254, 0, or none before 7/1)
const PHONE_REGEX = /^(?:\+?254|0)?(?:7|1)\d{8}$/;

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation (min 8 chars, at least one letter and one number)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// Voucher code validation
const VOUCHER_REGEX = /^[A-Z0-9-]{4,20}$/;

/**
 * Validate MAC address
 * @param {string} mac - MAC address to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateMacAddress(mac) {
    if (!mac) {
        return { isValid: false, message: 'MAC address is required' };
    }

    if (!MAC_REGEX.test(mac)) {
        return {
            isValid: false,
            message: 'Invalid MAC address format. Use format: AA:BB:CC:DD:EE:FF'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Normalize MAC address to uppercase colon format
 * @param {string} mac - MAC address to normalize
 * @returns {string} Normalized MAC address
 */
export function normalizeMacAddress(mac) {
    if (!mac) return '';

    // Remove any non-alphanumeric characters except colons and hyphens
    const cleaned = mac.replace(/[^0-9A-Fa-f:-]/g, '');

    // Convert to uppercase
    const upper = cleaned.toUpperCase();

    // If it has hyphens, convert to colons
    if (upper.includes('-')) {
        return upper.replace(/-/g, ':');
    }

    // If it has no separators, add colons every 2 characters
    if (!upper.includes(':') && upper.length === 12) {
        return upper.replace(/(.{2})/g, '$1:').slice(0, -1);
    }

    return upper;
}

/**
 * Validate phone number (Kenya format)
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validatePhone(phone) {
    if (!phone) {
        return { isValid: false, message: 'Phone number is required' };
    }

    if (!PHONE_REGEX.test(phone)) {
        return {
            isValid: false,
            message: 'Invalid phone number. Use: 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 1XXXXXXXX, 254XXXXXXXXX, or +254XXXXXXXXX'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
export function normalizePhone(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If starts with 0, replace with 254
    if (digits.startsWith('0')) {
        return '254' + digits.substring(1);
    }

    // If starts with 254, return as is
    if (digits.startsWith('254')) {
        return digits;
    }

    // If starts with 7 or 1, add 254 prefix
    if (digits.startsWith('7') || digits.startsWith('1')) {
        return '254' + digits;
    }

    return digits;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateEmail(email) {
    if (!email) {
        return { isValid: true, message: '' }; // Email is optional
    }

    if (!EMAIL_REGEX.test(email)) {
        return {
            isValid: false,
            message: 'Invalid email address format'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validatePassword(password) {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long'
        };
    }

    if (!PASSWORD_REGEX.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one letter and one number'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} Validation result with isValid and message
 */
export function validatePasswordConfirmation(password, confirmPassword) {
    if (!confirmPassword) {
        return { isValid: false, message: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return {
            isValid: false,
            message: 'Passwords do not match'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Validate voucher code
 * @param {string} code - Voucher code to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateVoucherCode(code) {
    if (!code) {
        return { isValid: false, message: 'Voucher code is required' };
    }

    if (!VOUCHER_REGEX.test(code)) {
        return {
            isValid: false,
            message: 'Invalid voucher code format. Use 4-20 characters (A-Z, 0-9, -)'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result with isValid and message
 */
export function validateName(name) {
    if (!name) {
        return { isValid: false, message: 'Name is required' };
    }

    if (name.trim().length < 2) {
        return {
            isValid: false,
            message: 'Name must be at least 2 characters long'
        };
    }

    if (name.trim().length > 50) {
        return {
            isValid: false,
            message: 'Name must be less than 50 characters'
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Validate form data object
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with isValid, errors, and data
 */
export function validateForm(data, rules) {
    const errors = {};
    let isValid = true;

    for (const [field, value] of Object.entries(data)) {
        const rule = rules[field];
        if (!rule) continue;

        const result = rule(value, data);
        if (!result.isValid) {
            errors[field] = result.message;
            isValid = false;
        }
    }

    return { isValid, errors, data };
}

/**
 * Common validation rules
 */
export const validationRules = {
    mac: (value) => validateMacAddress(value),
    phone: (value) => validatePhone(value),
    email: (value) => validateEmail(value),
    password: (value) => validatePassword(value),
    name: (value) => validateName(value),
    voucherCode: (value) => validateVoucherCode(value),
    confirmPassword: (value, data) => validatePasswordConfirmation(data.password, value)
};

