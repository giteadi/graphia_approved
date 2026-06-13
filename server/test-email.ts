import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'lgbtnnfvbupkfssd';
const EMAIL_USER = process.env.EMAIL_USER || 'adityasharma10102000@gmail.com';

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  try {
    const mailOptions = {
      from: EMAIL_USER,
      to: 'adityasharma10102000@gmail.com',
      subject: 'Test Email - GraphiaCheck',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from GraphiaCheck email service.</p>
          <p>If you received this email, the email configuration is working correctly!</p>
          <p style="color: #666; font-size: 12px;">This is an automated test email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
  } catch (error: any) {
    console.error('❌ Error sending test email:', error.message);
  }
}

testEmail();
