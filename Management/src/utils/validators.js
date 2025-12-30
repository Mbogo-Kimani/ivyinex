// Validation utilities for Eco Wifi Management System

// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone number validation (Kenyan format)
export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+254|254|0)?[7][0-9]{8}$/;
    return phoneRegex.test(phone);
};

// MAC address validation
export const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
};

// IP address validation
export const validateIpAddress = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
};

// Password validation
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
        errors: {
            minLength: password.length < minLength,
            noUpperCase: !hasUpperCase,
            noLowerCase: !hasLowerCase,
            noNumbers: !hasNumbers,
            noSpecialChar: !hasSpecialChar,
        }
    };
};

// Required field validation
export const validateRequired = (value) => {
    return value !== null && value !== undefined && value !== '';
};

// String length validation
export const validateLength = (value, min = 0, max = Infinity) => {
    if (typeof value !== 'string') return false;
    return value.length >= min && value.length <= max;
};

// Number range validation
export const validateRange = (value, min = -Infinity, max = Infinity) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
};

// Date validation
export const validateDate = (date) => {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
};

// Future date validation
export const validateFutureDate = (date) => {
    if (!validateDate(date)) return false;
    return new Date(date) > new Date();
};

// Past date validation
export const validatePastDate = (date) => {
    if (!validateDate(date)) return false;
    return new Date(date) < new Date();
};

// URL validation
export const validateUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Voucher code validation
export const validateVoucherCode = (code) => {
    const codeRegex = /^[A-Z0-9]{6,12}$/;
    return codeRegex.test(code);
};

// Package name validation
export const validatePackageName = (name) => {
    return validateLength(name, 3, 50);
};

// Package price validation
export const validatePackagePrice = (price) => {
    const num = Number(price);
    return !isNaN(num) && num > 0 && num <= 100000;
};

// Package duration validation
export const validatePackageDuration = (duration) => {
    const num = Number(duration);
    return !isNaN(num) && num > 0 && num <= 365;
};

// User role validation
export const validateUserRole = (role) => {
    const validRoles = ['admin', 'operator', 'viewer'];
    return validRoles.includes(role);
};

// Permission validation
export const validatePermission = (permission) => {
    const validPermissions = [
        'users.read',
        'users.write',
        'users.delete',
        'devices.read',
        'devices.write',
        'subscriptions.read',
        'subscriptions.write',
        'subscriptions.delete',
        'packages.read',
        'packages.write',
        'packages.delete',
        'vouchers.read',
        'vouchers.write',
        'vouchers.delete',
        'payments.read',
        'logs.read',
        'settings.read',
        'settings.write',
        'admin'
    ];
    return validPermissions.includes(permission);
};

// Form validation helper
export const validateForm = (data, rules) => {
    const errors = {};

    for (const [field, validators] of Object.entries(rules)) {
        const value = data[field];

        for (const validator of validators) {
            const result = validator(value);

            if (result !== true) {
                errors[field] = result;
                break;
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Common validation rules
export const validationRules = {
    email: [
        (value) => validateRequired(value) || 'Email is required',
        (value) => validateEmail(value) || 'Invalid email format'
    ],
    phone: [
        (value) => validateRequired(value) || 'Phone number is required',
        (value) => validatePhoneNumber(value) || 'Invalid phone number format'
    ],
    password: [
        (value) => validateRequired(value) || 'Password is required',
        (value) => {
            const result = validatePassword(value);
            return result.isValid || 'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters';
        }
    ],
    macAddress: [
        (value) => validateRequired(value) || 'MAC address is required',
        (value) => validateMacAddress(value) || 'Invalid MAC address format'
    ],
    ipAddress: [
        (value) => validateRequired(value) || 'IP address is required',
        (value) => validateIpAddress(value) || 'Invalid IP address format'
    ],
    required: [
        (value) => validateRequired(value) || 'This field is required'
    ],
    packageName: [
        (value) => validateRequired(value) || 'Package name is required',
        (value) => validatePackageName(value) || 'Package name must be 3-50 characters'
    ],
    packagePrice: [
        (value) => validateRequired(value) || 'Price is required',
        (value) => validatePackagePrice(value) || 'Price must be between 1 and 100,000'
    ],
    packageDuration: [
        (value) => validateRequired(value) || 'Duration is required',
        (value) => validatePackageDuration(value) || 'Duration must be between 1 and 365 days'
    ],
    voucherCode: [
        (value) => validateRequired(value) || 'Voucher code is required',
        (value) => validateVoucherCode(value) || 'Voucher code must be 6-12 alphanumeric characters'
    ],
    userRole: [
        (value) => validateRequired(value) || 'Role is required',
        (value) => validateUserRole(value) || 'Invalid user role'
    ],
    permission: [
        (value) => validateRequired(value) || 'Permission is required',
        (value) => validatePermission(value) || 'Invalid permission'
    ]
};

export default {
    validateEmail,
    validatePhoneNumber,
    validateMacAddress,
    validateIpAddress,
    validatePassword,
    validateRequired,
    validateLength,
    validateRange,
    validateDate,
    validateFutureDate,
    validatePastDate,
    validateUrl,
    validateVoucherCode,
    validatePackageName,
    validatePackagePrice,
    validatePackageDuration,
    validateUserRole,
    validatePermission,
    validateForm,
    validationRules,
};
