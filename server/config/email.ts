import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'lgbtnnfvbupkfssd';
const EMAIL_USER = process.env.EMAIL_USER || 'graphiacheck@gmail.com';

// Create transporter function (recreated each time to ensure fresh connection)
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP - GraphiaCheck',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password for GraphiaCheck.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email from GraphiaCheck.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const transporter = createTransporter();
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Welcome to GraphiaCheck - Your Journey Starts Here!',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a3a4a 0%, #2d5a6b 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">
            GraphiaCheck
          </h1>
          <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">
            Handwriting Assessment Tool
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a3a4a; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Welcome to the Family, ${name}! 👋
          </h2>
          
          <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            We're thrilled to have you join <strong>GraphiaCheck</strong>. Your account has been successfully created, and you're now ready to explore our powerful handwriting assessment tools.
          </p>

          <div style="background-color: #f8f9fa; border-left: 4px solid #1a3a4a; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #1a3a4a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
              What You Can Do:
            </h3>
            <ul style="color: #555555; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
              <li style="margin-bottom: 10px;">📝 Upload handwriting samples for professional analysis</li>
              <li style="margin-bottom: 10px;">📊 Get detailed reports with visual scoreboards</li>
              <li style="margin-bottom: 10px;">🎯 Identify learning challenges early</li>
              <li style="margin-bottom: 10px;">💾 Save and track progress over time</li>
              <li style="margin-bottom: 0;">📥 Download reports in PDF format</li>
            </ul>
          </div>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Our AI-powered diagnostic engine is calibrated for students from <strong>Grade 1 through College Year 3</strong>, providing clinically relevant insights to support educational decisions.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://graphiacheck.in" style="display: inline-block; background-color: #1a3a4a; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
              Get Started Now
            </a>
          </div>

          <p style="color: #666666; line-height: 1.6; margin: 0; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team. We're here to help you make the most of GraphiaCheck.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
            © 2024 GraphiaCheck. All rights reserved.
          </p>
          <p style="color: #888888; margin: 0; font-size: 12px;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
