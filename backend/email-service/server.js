// const express = require('express');
// const cors = require('cors');
// const crypto = require('crypto');
// const formData = require('form-data');
// const Mailgun = require('mailgun.js');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware  
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://gowealthy.app', 'https://www.gowealthy.app'],
// }));
// app.use(express.json());

// // Mailgun configuration - FREE TIER
// const mailgun = new Mailgun(formData);
// const mg = mailgun.client({
//   username: 'api',
//   key: process.env.MAILGUN_API_KEY,
// });

// const DOMAIN = process.env.MAILGUN_DOMAIN;

// console.log('🚀 Starting FREE Mailgun Email Service...');
// console.log('📧 Domain:', DOMAIN);
// console.log('🆓 FREE Tier: 100 emails/day');

// // In-memory store for OTPs (use Redis in production)
// const otpStore = new Map();

// // Generate 6-digit OTP
// const generateOTP = () => {
//   return crypto.randomInt(100000, 999999).toString();
// };

// // Send OTP Email
// app.post('/api/send-otp', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email || !email.includes('@')) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Valid email is required' 
//       });
//     }

//     // Generate OTP
//     const otp = generateOTP();
    
//     // Store OTP with expiration (10 minutes)
//     otpStore.set(email, {
//       otp,
//       expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
//       attempts: 0
//     });

//     // Professional email template
//     const emailHtml = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
//         .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; }
//         .header { background: linear-gradient(135deg, #6b50c4 0%, #8b5cf6 100%); padding: 30px; text-align: center; color: white; }
//         .content { padding: 30px; text-align: center; }
//         .otp-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
//         .otp-code { font-size: 32px; font-weight: bold; color: #6b50c4; letter-spacing: 8px; }
//         .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>🔐 GoWealthy Verification</h1>
//           <p>Your Investment Journey Starts Here</p>
//         </div>
//         <div class="content">
//           <h2>Email Verification Code</h2>
//           <p>Enter this code to verify your email and continue with your mutual fund investment setup:</p>
//           <div class="otp-box">
//             <div class="otp-code">${otp}</div>
//           </div>
//           <p><strong>⏰ Valid for 10 minutes</strong></p>
//           <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
//         </div>
//         <div class="footer">
//           <p>GoWealthy - Secure • Transparent • Trusted</p>
//         </div>
//       </div>
//     </body>
//     </html>`;

//     // Send email via Mailgun
//     const messageData = {
//       from: `GoWealthy <noreply@${DOMAIN}>`,
//       to: email,
//       subject: `${otp} - GoWealthy Email Verification`,
//       html: emailHtml,
//       text: `GoWealthy Email Verification\n\nYour verification code: ${otp}\n\nValid for 10 minutes.`
//     };

//     await mg.messages.create(DOMAIN, messageData);
    
//     console.log(`✅ OTP sent to ${email}: ${otp}`);

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       // Remove in production: otp
//     });

//   } catch (error) {
//     console.error('❌ Error sending email:', error);
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send email. Please try again.',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // Verify OTP
// app.post('/api/verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and OTP are required'
//       });
//     }

//     const storedData = otpStore.get(email);

//     if (!storedData) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP not found. Please request a new one.'
//       });
//     }

//     // Check if OTP is expired
//     if (Date.now() > storedData.expiresAt) {
//       otpStore.delete(email);
//       return res.status(400).json({
//         success: false,
//         message: 'OTP has expired. Please request a new one.'
//       });
//     }

//     // Check attempts (max 3)
//     if (storedData.attempts >= 3) {
//       otpStore.delete(email);
//       return res.status(400).json({
//         success: false,
//         message: 'Too many failed attempts. Please request a new OTP.'
//       });
//     }

//     // Verify OTP
//     if (storedData.otp !== otp.toString()) {
//       storedData.attempts++;
//       otpStore.set(email, storedData);
      
//       return res.status(400).json({
//         success: false,
//         message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
//       });
//     }

//     // OTP is valid - remove from store
//     otpStore.delete(email);

//     console.log(`✅ Email verified: ${email}`);

//     res.json({
//       success: true,
//       message: 'Email verified successfully',
//       emailVerified: true
//     });

//   } catch (error) {
//     console.error('❌ Error verifying OTP:', error);
    
//     res.status(500).json({
//       success: false,
//       message: 'Verification failed. Please try again.'
//     });
//   }
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     success: true, 
//     message: 'GoWealthy Email Service is running',
//     timestamp: new Date().toISOString(),
//     domain: DOMAIN
//   });
// });

// // Cleanup expired OTPs every 5 minutes
// setInterval(() => {
//   const now = Date.now();
//   for (const [email, data] of otpStore.entries()) {
//     if (now > data.expiresAt) {
//       otpStore.delete(email);
//       console.log(`🧹 Cleaned up expired OTP for ${email}`);
//     }
//   }
// }, 5 * 60 * 1000);

// app.listen(PORT, () => {
//   console.log(`🚀 GoWealthy Email Service running on port ${PORT}`);
//   console.log(`📧 Mailgun Domain: ${DOMAIN || 'Not configured'}`);
//   console.log(`🔑 API Key: ${process.env.MAILGUN_API_KEY ? 'Set ✅' : 'Missing ❌'}`);
// });

// module.exports = app;
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware  
app.use(cors({
  origin: ['http://localhost:5173', 'https://gowealthy.app', 'https://www.gowealthy.app']
}));
app.use(express.json());

// Mailgun configuration - FREE TIER
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

const DOMAIN = process.env.MAILGUN_DOMAIN;

console.log('🚀 Starting FREE Mailgun Email Service...');
console.log('📧 Domain:', DOMAIN);
console.log('🆓 FREE Tier: 100 emails/day');

// In-memory store for OTPs (use Redis in production)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP Email
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid email is required' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (10 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    // Anti-spam optimized email template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GoWealthy Email Verification</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #6b50c4; padding: 25px 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 25px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .message { font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 25px; }
        .otp-container { text-align: center; margin: 25px 0; }
        .otp-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; display: inline-block; }
        .otp-code { font-size: 28px; font-weight: bold; color: #6b50c4; letter-spacing: 4px; font-family: 'Courier New', monospace; }
        .otp-label { color: #666; font-size: 14px; margin-top: 8px; }
        .instructions { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
        .instructions p { margin: 0; color: #1565c0; font-size: 14px; }
        .security-note { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        .security-note p { margin: 0; color: #ef6c00; font-size: 13px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 0; color: #666; font-size: 12px; line-height: 1.4; }
        .footer a { color: #6b50c4; text-decoration: none; }
        @media (max-width: 600px) { 
          .container { margin: 10px; border-radius: 4px; }
          .content, .header, .footer { padding: 20px 15px; }
          .otp-code { font-size: 24px; letter-spacing: 2px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>GoWealthy</h1>
          <p>Mutual Fund Investment Platform</p>
        </div>
        
        <div class="content">
          <div class="greeting">Welcome to GoWealthy!</div>
          
          <div class="message">
            Thank you for choosing GoWealthy for your mutual fund investments. To complete your account setup, please verify your email address using the code below:
          </div>
          
          <div class="otp-container">
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Verification Code</div>
            </div>
          </div>
          
          <div class="instructions">
            <p><strong>Instructions:</strong> Enter this 6-digit code in the verification field on the GoWealthy app. This code will expire in 10 minutes.</p>
          </div>
          
          <div class="security-note">
            <p><strong>Security Notice:</strong> GoWealthy will never ask you to share this code via phone or email. If you didn't request this verification, please ignore this email.</p>
          </div>
          
          <div class="message">
            Once verified, you'll have access to our comprehensive mutual fund investment platform with expert recommendations and portfolio management tools.
          </div>
        </div>
        
        <div class="footer">
          <p><strong>GoWealthy Investment Platform</strong><br>
          Making mutual fund investing simple and accessible<br>
          <a href="https://gowealthy.app">Visit GoWealthy.app</a></p>
          
          <p style="margin-top: 15px;">
            This is an automated message. Please do not reply to this email.<br>
            If you need assistance, contact us at <a href="mailto:support@gowealthy.app">support@gowealthy.app</a>
          </p>
        </div>
      </div>
    </body>
    </html>`;

    const plainTextEmail = `
GoWealthy - Email Verification

Welcome to GoWealthy!

Thank you for choosing GoWealthy for your mutual fund investments. To complete your account setup, please verify your email address.

Your verification code: ${otp}

Instructions:
- Enter this 6-digit code in the verification field on the GoWealthy app
- This code expires in 10 minutes
- GoWealthy will never ask you to share this code via phone or email

Once verified, you'll have access to our comprehensive mutual fund investment platform.

GoWealthy Investment Platform
Visit: https://gowealthy.app
Support: support@gowealthy.app

This is an automated message. Please do not reply to this email.
    `;

    // Anti-spam optimized message data
    const messageData = {
      from: `GoWealthy Support <noreply@${DOMAIN}>`,
      to: email,
      subject: `Verify your GoWealthy account`,
      html: emailHtml,
      text: plainTextEmail,
      'h:List-Unsubscribe': '<mailto:unsubscribe@gowealthy.app>',
      'h:X-Mailgun-Tag': 'account-verification',
      'h:X-Mailgun-Track': 'yes',
      'h:X-Mailgun-Track-Clicks': 'yes',
      'h:X-Mailgun-Track-Opens': 'yes',
      'h:Reply-To': 'support@gowealthy.app'
    };

    await mg.messages.create(DOMAIN, messageData);
    
    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Remove in production: otp
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp.toString()) {
      storedData.attempts++;
      otpStore.set(email, storedData);
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // OTP is valid - remove from store
    otpStore.delete(email);

    console.log(`✅ Email verified: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      emailVerified: true
    });

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'GoWealthy Email Service is running',
    timestamp: new Date().toISOString(),
    domain: DOMAIN
  });
});

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
      console.log(`🧹 Cleaned up expired OTP for ${email}`);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 GoWealthy Email Service running on port ${PORT}`);
  console.log(`📧 Mailgun Domain: ${DOMAIN || 'Not configured'}`);
  console.log(`🔑 API Key: ${process.env.MAILGUN_API_KEY ? 'Set ✅' : 'Missing ❌'}`);
});

module.exports = app;