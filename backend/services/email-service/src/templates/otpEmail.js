/**
 * Anti-spam optimised verification email. Returns Mailgun message data for
 * the given recipient and OTP.
 */
export function buildOtpMessage({ email, otp, domain }) {
    const html = `
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

    const text = `
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

    return {
        from: `GoWealthy Support <noreply@${domain}>`,
        to: email,
        subject: `Verify your GoWealthy account`,
        html,
        text,
        "h:List-Unsubscribe": "<mailto:unsubscribe@gowealthy.app>",
        "h:X-Mailgun-Tag": "account-verification",
        "h:X-Mailgun-Track": "yes",
        "h:X-Mailgun-Track-Clicks": "yes",
        "h:X-Mailgun-Track-Opens": "yes",
        "h:Reply-To": "support@gowealthy.app",
    };
}
