const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    // Create transporter using Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
      console.log('✅ Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
      console.error('❌ Email service connection failed:', error.message);
    }
  }

  async sendVerificationCode(email, code, type = 'registration') {
    try {
      const subject = type === 'registration' 
        ? 'UniTree - Email Verification Code'
        : 'UniTree - Password Reset Code';

      const htmlContent = type === 'registration'
        ? this.getRegistrationEmailTemplate(code)
        : this.getPasswordResetEmailTemplate(code);

      const textContent = type === 'registration'
        ? `Your UniTree verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
        : `Your UniTree password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

      const mailOptions = {
        from: {
          name: 'UniTree',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${email}. Message ID: ${result.messageId}`);
      console.log(`✅ Email sent successfully to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  getRegistrationEmailTemplate(code) {
    return `
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
  }

  getPasswordResetEmailTemplate(code) {
    return `
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
  }

  // Test email function for development
  async sendTestEmail(email) {
    try {
      const mailOptions = {
        from: {
          name: 'UniTree',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'UniTree - Email Service Test',
        text: 'This is a test email from UniTree email service. If you received this, the email configuration is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">🌳 UniTree Email Service Test</h2>
            <p>This is a test email from UniTree email service.</p>
            <p style="color: #4CAF50; font-weight: bold;">✅ If you received this, the email configuration is working correctly!</p>
            <hr style="margin: 20px 0; border: 1px solid #eee;">
            <p style="font-size: 14px; color: #666;">
              Email sent at: ${new Date().toLocaleString()}<br>
              Service: Gmail SMTP<br>
              Status: Active
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent successfully to ${email}. Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Test email failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService; 