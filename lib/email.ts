import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to take our messages');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetLink: string, userName?: string) {
  try {
    const mailOptions = {
      from: {
        name: 'ErrorX Community',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@errorx.com'
      },
      to: email,
      subject: 'Reset Your Password - ErrorX Community',
      html: generatePasswordResetHTML(resetLink, userName),
      text: generatePasswordResetText(resetLink, userName),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    const mailOptions = {
      from: {
        name: 'ErrorX Community',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@errorx.com'
      },
      to: email,
      subject: 'Welcome to ErrorX Community!',
      html: generateWelcomeHTML(userName),
      text: generateWelcomeText(userName),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// HTML template for password reset email
function generatePasswordResetHTML(resetLink: string, userName?: string): string {
  const displayName = userName || 'there';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }
        .subtitle {
          color: #718096;
          margin: 8px 0 0 0;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
        }
        .button:hover {
          opacity: 0.9;
        }
        .link {
          word-break: break-all;
          background: #f7fafc;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          color: #4a5568;
          margin: 20px 0;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          text-align: center;
          color: #718096;
          font-size: 14px;
        }
        .warning {
          background: #fef5e7;
          border: 1px solid #f6e05e;
          border-radius: 6px;
          padding: 12px;
          margin: 20px 0;
          color: #744210;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡</div>
          <h1 class="title">Reset Your Password</h1>
          <p class="subtitle">ErrorX Community</p>
        </div>
        
        <div class="content">
          <p>Hi ${displayName},</p>
          
          <p>We received a request to reset your password for your ErrorX Community account. If you made this request, click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="link">${resetLink}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 24 hours for security reasons. If you didn't request this password reset, you can safely ignore this email.
          </div>
          
          <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from ErrorX Community. If you have any questions, please contact our support team.</p>
          <p>© ${new Date().getFullYear()} ErrorX Community. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Text template for password reset email
function generatePasswordResetText(resetLink: string, userName?: string): string {
  const displayName = userName || 'there';
  
  return `
Reset Your Password - ErrorX Community

Hi ${displayName},

We received a request to reset your password for your ErrorX Community account. If you made this request, click the link below to reset your password:

${resetLink}

This link will expire in 24 hours for security reasons. If you didn't request this password reset, you can safely ignore this email.

If you're having trouble with the link, copy and paste the URL above into your web browser.

Best regards,
ErrorX Community Team

---
This email was sent from ErrorX Community. If you have any questions, please contact our support team.
© ${new Date().getFullYear()} ErrorX Community. All rights reserved.
  `;
}

// HTML template for welcome email
function generateWelcomeHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ErrorX Community</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }
        .subtitle {
          color: #718096;
          margin: 8px 0 0 0;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
        }
        .feature {
          display: flex;
          align-items: center;
          margin: 15px 0;
        }
        .feature-icon {
          width: 24px;
          height: 24px;
          background: #667eea;
          border-radius: 6px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          text-align: center;
          color: #718096;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡</div>
          <h1 class="title">Welcome to ErrorX!</h1>
          <p class="subtitle">Your developer community awaits</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>Welcome to ErrorX Community! We're excited to have you join our vibrant developer community. You're now part of a network of developers who share knowledge, solve problems, and grow together.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}" class="button">Get Started</a>
          </div>
          
          <h3>What you can do:</h3>
          <div class="feature">
            <div class="feature-icon">💬</div>
            <span>Ask questions and get help from the community</span>
          </div>
          <div class="feature">
            <div class="feature-icon">📝</div>
            <span>Share your knowledge and write tutorials</span>
          </div>
          <div class="feature">
            <div class="feature-icon">⭐</div>
            <span>Build your reputation through helpful contributions</span>
          </div>
          <div class="feature">
            <div class="feature-icon">🔍</div>
            <span>Discover solutions and best practices</span>
          </div>
          
          <p>Ready to dive in? Start by exploring the latest discussions or introduce yourself to the community!</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from ErrorX Community. If you have any questions, please contact our support team.</p>
          <p>© ${new Date().getFullYear()} ErrorX Community. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Text template for welcome email
function generateWelcomeText(userName: string): string {
  return `
Welcome to ErrorX Community!

Hi ${userName},

Welcome to ErrorX Community! We're excited to have you join our vibrant developer community. You're now part of a network of developers who share knowledge, solve problems, and grow together.

What you can do:
• Ask questions and get help from the community
• Share your knowledge and write tutorials
• Build your reputation through helpful contributions
• Discover solutions and best practices

Ready to dive in? Visit ${process.env.NEXTAUTH_URL} to get started!

Best regards,
ErrorX Community Team

---
This email was sent from ErrorX Community. If you have any questions, please contact our support team.
© ${new Date().getFullYear()} ErrorX Community. All rights reserved.
  `;
}
