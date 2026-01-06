/**
 * Email Service using Brevo (Sendinblue)
 * Handles transactional emails, password resets, and marketing emails
 */

const SibApiV3Sdk = require('@getbrevo/brevo');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Initialize Brevo API client
let apiInstance = null;

// Initialize the email service
function initializeEmailService() {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
        logger.warn('BREVO_API_KEY not found. Email service will be disabled.');
        return false;
    }

    try {
        // Create API instance
        apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
        // Set API key using the instance method (new Brevo SDK pattern)
        apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        
        logger.info('Email service initialized successfully');
        return true;
    } catch (error) {
        logger.error('Failed to initialize email service', { error: error.message });
        return false;
    }
}

// Get email configuration from environment
function getEmailConfig() {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME || 'Wifi Mtaani';
    
    if (!fromAddress) {
        logger.warn('EMAIL_FROM_ADDRESS not configured. Email sending may fail.');
    }
    
    return {
        fromName,
        fromAddress: fromAddress || 'noreply@wifi-mtaani.com', // Fallback for development
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    };
}

// Validate sender email configuration
function validateSenderEmail() {
    const config = getEmailConfig();
    
    if (!config.fromAddress || config.fromAddress === 'noreply@wifi-mtaani.com') {
        logger.warn('EMAIL_FROM_ADDRESS not set or using default. Please configure your personal email address.');
        return false;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.fromAddress)) {
        logger.error('Invalid EMAIL_FROM_ADDRESS format', { email: config.fromAddress });
        return false;
    }
    
    return true;
}

/**
 * Send transactional email using Brevo
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.toName - Recipient name (optional)
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - HTML email content
 * @param {string} options.textContent - Plain text email content (optional)
 * @param {Object} options.params - Template parameters (optional)
 * @returns {Promise<Object>} - Send result
 */
async function sendEmail({ to, toName, subject, htmlContent, textContent, params = {} }) {
    // Always check if API key is available (in case it was added after server start)
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        throw new Error('Email service is not initialized. BREVO_API_KEY not found in environment variables.');
    }
    
    // Initialize or re-initialize if needed
    if (!apiInstance) {
        const initialized = initializeEmailService();
        if (!initialized) {
            throw new Error('Email service is not initialized. Check BREVO_API_KEY.');
        }
    }

    const config = getEmailConfig();
    
    // Validate sender email configuration
    if (!validateSenderEmail()) {
        logger.warn('Sender email validation failed. Email may not be sent.', {
            fromAddress: config.fromAddress,
        });
    }
    
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.textContent = textContent || htmlContent.replace(/<[^>]*>/g, '');
        
        // Set sender explicitly from environment variables
        sendSmtpEmail.sender = {
            name: config.fromName,
            email: config.fromAddress, // Personal email from EMAIL_FROM_ADDRESS
        };
        
        // Add Reply-To header matching sender email for better deliverability
        sendSmtpEmail.replyTo = {
            email: config.fromAddress,
            name: config.fromName,
        };
        
        sendSmtpEmail.to = [{
            email: to,
            name: toName || to,
        }];

        // Add template parameters if provided
        if (Object.keys(params).length > 0) {
            sendSmtpEmail.params = params;
        }

        // Ensure API key is set before sending
        const apiKey = process.env.BREVO_API_KEY;
        if (apiKey && apiInstance) {
            apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        }

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        
        logger.info('Email sent successfully', {
            to,
            from: config.fromAddress,
            messageId: result.messageId,
            subject,
        });

        return {
            success: true,
            messageId: result.messageId,
        };
    } catch (error) {
        // Handle Brevo sender validation errors gracefully
        const errorResponse = error.response?.body || error.body;
        const errorCode = errorResponse?.code;
        const errorMessage = errorResponse?.message || error.message || String(error);
        const statusCode = error.response?.statusCode || error.statusCode || error.status;
        
        // Log full error details for debugging (server-side only)
        logger.error('Failed to send email - Full error details', {
            to,
            fromAddress: config.fromAddress,
            subject,
            errorCode,
            errorMessage,
            statusCode,
            errorName: error.name,
            errorStack: error.stack,
            errorResponse: errorResponse ? JSON.stringify(errorResponse).substring(0, 500) : null,
        });
        
        // Check for sender validation errors
        if (errorCode === 'invalid_parameter' || 
            errorMessage?.toLowerCase().includes('sender') || 
            errorMessage?.toLowerCase().includes('from') || 
            errorMessage?.toLowerCase().includes('verified') ||
            errorMessage?.toLowerCase().includes('not authorized') ||
            statusCode === 401 || statusCode === 403) {
            logger.error('Brevo sender validation/authentication error', {
                to,
                fromAddress: config.fromAddress,
                errorCode,
                errorMessage,
                statusCode,
                hint: 'Ensure EMAIL_FROM_ADDRESS is verified in Brevo dashboard (Settings → Senders) and BREVO_API_KEY is correct',
            });
            
            throw new Error('Sender email not verified in Brevo or API key invalid. Please verify your email address in the Brevo dashboard.');
        }
        
        // Check for API key errors
        if (errorMessage?.toLowerCase().includes('api key') || 
            errorMessage?.toLowerCase().includes('unauthorized') ||
            statusCode === 401) {
            logger.error('Brevo API key error', {
                to,
                fromAddress: config.fromAddress,
                errorMessage,
                hint: 'Check BREVO_API_KEY in environment variables',
            });
            
            throw new Error('Email service configuration error. Please contact support.');
        }

        // Don't expose sensitive information in error, but log it for debugging
        throw new Error('Failed to send email. Please try again later.');
    }
}

/**
 * Send email asynchronously (fire and forget)
 * @param {Object} options - Email options
 */
function sendEmailAsync(options) {
    sendEmail(options).catch(error => {
        logger.error('Async email send failed', {
            to: options.to,
            error: error.message,
        });
    });
}

/**
 * Add or update contact in Brevo
 * @param {string} email - Contact email
 * @param {Object} attributes - Contact attributes (name, phone, etc.)
 * @param {Array<number>} listIds - List IDs to add contact to
 * @param {boolean} emailBlacklisted - Whether to blacklist email
 * @returns {Promise<Object>}
 */
async function addContactToBrevo(email, attributes = {}, listIds = [], emailBlacklisted = false) {
    if (!process.env.BREVO_API_KEY) {
        logger.warn('BREVO_API_KEY not found. Skipping contact sync.');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const contactsApi = new SibApiV3Sdk.ContactsApi();
        
        // Set API key for contacts API
        const apiKey = process.env.BREVO_API_KEY;
        if (apiKey) {
            contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, apiKey);
        }
        
        const createContact = new SibApiV3Sdk.CreateContact();
        createContact.email = email;
        createContact.attributes = attributes;
        createContact.listIds = listIds;
        createContact.emailBlacklisted = emailBlacklisted;
        createContact.updateEnabled = true; // Update if contact exists

        const result = await contactsApi.createContact(createContact);
        
        logger.info('Contact added/updated in Brevo', { email, listIds });
        
        return {
            success: true,
            id: result.id,
        };
    } catch (error) {
        // Handle case where contact already exists (not an error)
        if (error.response?.statusCode === 400 && error.response?.body?.code === 'duplicate_parameter') {
            logger.info('Contact already exists in Brevo', { email });
            return { success: true, message: 'Contact already exists' };
        }

        // Handle authentication errors (401)
        const errorResponse = error.response?.body || error.body;
        const statusCode = error.response?.statusCode || error.statusCode || error.status;
        
        if (statusCode === 401) {
            logger.error('Brevo API authentication failed when adding contact', {
                email,
                error: error.message,
                hint: 'Check BREVO_API_KEY in environment variables - it may be invalid or expired',
            });
            return {
                success: false,
                error: 'Brevo API authentication failed. Please check API key configuration.',
            };
        }

        logger.error('Failed to add contact to Brevo', {
            email,
            error: error.message,
            statusCode,
            errorResponse: errorResponse ? JSON.stringify(errorResponse).substring(0, 200) : null,
        });

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Remove contact from Brevo list
 * @param {string} email - Contact email
 * @param {Array<number>} listIds - List IDs to remove from
 * @returns {Promise<Object>}
 */
async function removeContactFromBrevo(email, listIds = []) {
    if (!process.env.BREVO_API_KEY) {
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const contactsApi = new SibApiV3Sdk.ContactsApi();
        
        // Set API key for contacts API
        const apiKey = process.env.BREVO_API_KEY;
        if (apiKey) {
            contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, apiKey);
        }
        
        await contactsApi.removeContactFromList(listIds[0], { emails: [email] });
        
        logger.info('Contact removed from Brevo list', { email, listIds });
        
        return { success: true };
    } catch (error) {
        logger.error('Failed to remove contact from Brevo', {
            email,
            error: error.message,
        });

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Update contact email preferences
 * @param {string} email - Contact email
 * @param {boolean} emailBlacklisted - Whether to blacklist
 * @returns {Promise<Object>}
 */
async function updateContactPreferences(email, emailBlacklisted) {
    if (!process.env.BREVO_API_KEY) {
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const contactsApi = new SibApiV3Sdk.ContactsApi();
        
        // Set API key for contacts API
        const apiKey = process.env.BREVO_API_KEY;
        if (apiKey) {
            contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, apiKey);
        }
        
        const updateContact = new SibApiV3Sdk.UpdateContact();
        updateContact.emailBlacklisted = emailBlacklisted;

        await contactsApi.updateContact(email, updateContact);
        
        logger.info('Contact preferences updated in Brevo', { email, emailBlacklisted });
        
        return { success: true };
    } catch (error) {
        logger.error('Failed to update contact preferences in Brevo', {
            email,
            error: error.message,
        });

        return {
            success: false,
            error: error.message,
        };
    }
}

// Initialize on module load (but only if dotenv has already loaded)
// Delay initialization to ensure dotenv has loaded first
// This will be called when the module is first required, but we'll re-check when actually sending
setTimeout(() => {
    initializeEmailService();
    
    // Validate sender email on startup
    if (process.env.EMAIL_FROM_ADDRESS) {
        validateSenderEmail();
    } else {
        logger.warn('EMAIL_FROM_ADDRESS not set. Configure your personal email address in environment variables.');
    }
}, 100); // Small delay to ensure dotenv has loaded

module.exports = {
    sendEmail,
    sendEmailAsync,
    addContactToBrevo,
    removeContactFromBrevo,
    updateContactPreferences,
    getEmailConfig,
    initializeEmailService,
    validateSenderEmail,
};


