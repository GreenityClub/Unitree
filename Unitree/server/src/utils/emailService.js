const nodemailer = require('nodemailer');
const logger = require('./logger');
const { env } = require('../config/env');

// =================================================================
// ==                      EMAIL TEMPLATES                      ==
// =================================================================

/**
 * Generates the HTML content for a registration verification email.
 * @param {string} code - The 6-digit verification code.
 * @returns {string} - The HTML email template.
 */
const getRegistrationEmailTemplate = (code) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UniTree Email Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #4CAF50;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .code-container {
            background: #f8f9fa;
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .code-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .warning {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌳 UniTree</div>
            <h1 class="title">Email Verification</h1>
          </div>
          
          <p>Welcome to UniTree! Please use the verification code below to complete your registration:</p>
          
          <div class="code-container">
            <div class="code-label">Your verification code is:</div>
            <div class="code">${code}</div>
          </div>
          
          <div class="instructions">
            <h3>How to use this code:</h3>
            <ol>
              <li>Return to the UniTree app</li>
              <li>Enter this 6-digit code in the verification field</li>
              <li>Complete your registration process</li>
            </ol>
          </div>
          
          <p class="warning">
            ⚠️ This code will expire in 10 minutes.<br>
            If you didn't request this code, please ignore this email.
          </p>
          
          <div class="footer">
            <p>Thank you for joining UniTree!<br>
            Together, we're growing a greener future. 🌱</p>
          </div>
        </div>
      </body>
      </html>
    `;

/**
 * Generates the HTML content for a password reset email.
 * @param {string} code - The 6-digit password reset code.
 * @returns {string} - The HTML email template.
 */
const getPasswordResetEmailTemplate = (code) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UniTree Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #4CAF50;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .code-container {
            background: #fff3cd;
            border: 2px dashed #ff9800;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #ff9800;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .code-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .instructions {
            background: #fff3e5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .warning {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 20px;
            text-align: center;
          }
          .security-note {
            background: #ffebee;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌳 UniTree</div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <p>We received a request to reset your UniTree account password. Use the code below to reset your password:</p>
          
          <div class="code-container">
            <div class="code-label">Your password reset code is:</div>
            <div class="code">${code}</div>
          </div>
          
          <div class="instructions">
            <h3>How to reset your password:</h3>
            <ol>
              <li>Return to the UniTree app</li>
              <li>Enter this 6-digit code in the verification field</li>
              <li>Create your new password</li>
              <li>Log in with your new password</li>
            </ol>
          </div>
          
          <div class="security-note">
            <strong>🔒 Security Notice:</strong><br>
            If you didn't request this password reset, please ignore this email and consider changing your password as a precaution.
          </div>
          
          <p class="warning">
            ⚠️ This code will expire in 10 minutes.<br>
            For security reasons, you can only use this code once.
          </p>
          
          <div class="footer">
            <p>Stay secure with UniTree! 🛡️<br>
            If you need help, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;


// =================================================================
// ==                       EMAIL SERVICE                       ==
// =================================================================

class EmailService {
  constructor() {
    if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
      logger.error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });
      this.verifyConnection();
    }
  }

  /**
   * Verifies the SMTP connection to the email server.
   */
  async verifyConnection() {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      logger.info('Email service connected and ready to send emails.');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  /**
   * A generic method to send an email.
   * @param {Object} mailOptions - Nodemailer mail options object.
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendEmail(mailOptions) {
    if (!this.transporter) {
      const errorMsg = 'Email service is not configured.';
      logger.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    try {
      const result = await this.transporter.sendMail({
        from: { name: 'UniTree', address: env.EMAIL_USER },
        ...mailOptions,
      });
      logger.info(`Email sent to ${mailOptions.to}. Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${mailOptions.to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a verification or password reset code to a user.
   * @param {string} email - The recipient's email address.
   * @param {string} code - The 6-digit code.
   * @param {'registration' | 'password_reset'} type - The type of email to send.
   */
  async sendVerificationCode(email, code, type = 'registration') {
    const isRegistration = type === 'registration';
    return this.sendEmail({
      to: email,
      subject: isRegistration ? 'UniTree - Email Verification Code' : 'UniTree - Password Reset Code',
      html: isRegistration ? getRegistrationEmailTemplate(code) : getPasswordResetEmailTemplate(code),
      text: `Your code is: ${code}. It will expire in 10 minutes.`,
    });
  }
}

module.exports = new EmailService(); 