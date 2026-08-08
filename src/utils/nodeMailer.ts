import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (
  toEmail: string,
  otp: string,
  name?: string,
  logoUrl: string = 'https://skssf-kolmanna-frontend.vercel.app/logo.webp' // Ensure this file exists in your frontend public folder
) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); padding: 32px; text-align: center;">
              
              <!-- Header / Logo Profile Image -->
              <tr>
                <td align="center" style="padding-bottom: 16px;">
                  <img 
                    src="${logoUrl}" 
                    alt="SKSSF Logo" 
                    width="75" 
                    height="75" 
                    style="display: block; width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;" 
                  />
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td>
                  <h2 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Password Reset Request</h2>
                  <p style="margin-top: 4px; color: #64748b; font-size: 14px;">SKSSF Officials Portal</p>
                </td>
              </tr>

              <!-- Greeting & Body -->
              <tr>
                <td style="padding-top: 24px; text-align: left; color: #334155; font-size: 15px; line-height: 1.5;">
                  Hello ${name || 'User'},<br><br>
                  We received a request to reset your password. Use the verification code below to complete the process:
                </td>
              </tr>

              <!-- OTP Code Display -->
              <tr>
                <td style="padding: 24px 0;">
                  <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">
                    ${otp}
                  </div>
                </td>
              </tr>

              <!-- Expiration Warning -->
              <tr>
                <td style="color: #64748b; font-size: 13px; line-height: 1.5;">
                  ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
                  If you didn't request a password reset, please ignore this email.
                </td>
              </tr>

              <!-- Spam Folder Notice -->
              <tr>
                <td style="padding-top: 20px;">
                  <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; color: #854d0e; font-size: 12px; line-height: 1.4; text-align: center;">
                    📂 Can't find future updates in your inbox? Please check your <strong>Spam or Junk folder</strong> and mark this email as <em>"Not Spam"</em>.
                  </div>
                </td>
              </tr>

              <!-- Footer Divider -->
              <tr>
                <td style="padding-top: 28px; border-bottom: 1px solid #e2e8f0;"></td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
                  This is an automated message from SKSSF. Please do not reply.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"SKSSF Support" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} is your Password Reset Verification Code`,
    html: htmlContent,
  });
};