/**
 * Email Templates for Brevo
 * Responsive HTML templates with inline CSS
 */

const { getEmailConfig } = require('./emailService');

/**
 * Base email template wrapper
 */
function getBaseTemplate(content, unsubscribeLink = null) {
    const config = getEmailConfig();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Wifi Mtaani</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Wifi Mtaani</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666666;">
                            <p style="margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} Wifi Mtaani. All rights reserved.
                            </p>
                            ${unsubscribeLink ? `
                            <p style="margin: 0;">
                                <a href="${unsubscribeLink}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
                            </p>
                            ` : ''}
                            <p style="margin: 10px 0 0 0; color: #999999;">
                                This is an automated email. Please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Password Reset Email Template
 */
function getPasswordResetTemplate(userName, resetLink, expiryMinutes = 120) {
    // Format expiry time in a user-friendly way
    let expiryText;
    if (expiryMinutes >= 60) {
        const hours = Math.floor(expiryMinutes / 60);
        const minutes = expiryMinutes % 60;
        if (minutes === 0) {
            expiryText = hours === 1 ? '1 hour' : `${hours} hours`;
        } else {
            expiryText = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    } else {
        expiryText = expiryMinutes === 1 ? '1 minute' : `${expiryMinutes} minutes`;
    }
    
    const content = `
        <div style="color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                Reset Your Password
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${userName || 'there'},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Reset Password
                </a>
            </div>
            
            <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
            </p>
            <p style="margin: 10px 0 20px 0; color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetLink}
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                    <strong>⚠️ Security Notice:</strong> This link will expire in ${expiryText}. If you didn't request this, please ignore this email or contact support if you have concerns.
                </p>
            </div>
        </div>
    `;
    
    return getBaseTemplate(content);
}

/**
 * Welcome Email Template
 */
function getWelcomeTemplate(userName, loginLink) {
    const content = `
        <div style="color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                Welcome to Wifi Mtaani! 🎉
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${userName || 'there'},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining Wifi Mtaani! We're excited to have you on board.
            </p>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Get started by logging in to your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" 
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Log In to Your Account
                </a>
            </div>
            
            <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                    <strong>💡 Tip:</strong> Explore our affordable internet packages and enjoy fast, reliable connectivity!
                </p>
            </div>
        </div>
    `;
    
    return getBaseTemplate(content);
}

/**
 * Marketing/Announcement Email Template
 */
function getMarketingTemplate(title, content, ctaText, ctaLink, unsubscribeLink) {
    const marketingContent = `
        <div style="color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                ${title}
            </h2>
            
            <div style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${content}
            </div>
            
            ${ctaLink && ctaText ? `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${ctaLink}" 
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    ${ctaText}
                </a>
            </div>
            ` : ''}
        </div>
    `;
    
    return getBaseTemplate(marketingContent, unsubscribeLink);
}

/**
 * Password Changed Confirmation Email
 */
function getPasswordChangedTemplate(userName) {
    const content = `
        <div style="color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
                Password Changed Successfully
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${userName || 'there'},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Your password has been successfully changed.
            </p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                    <strong>✅ Security Confirmed:</strong> If you didn't make this change, please contact our support team immediately.
                </p>
            </div>
        </div>
    `;
    
    return getBaseTemplate(content);
}

module.exports = {
    getPasswordResetTemplate,
    getWelcomeTemplate,
    getMarketingTemplate,
    getPasswordChangedTemplate,
    getBaseTemplate,
};


