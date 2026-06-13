import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { sendOTPEmail, generateOTP } from '../config/email.js';

// In-memory OTP storage (not saved to DB as requested)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

export async function sendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if user exists
    const users = await query<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in memory
    otpStorage.set(email, { otp, expiresAt });

    // Send OTP email
    await sendOTPEmail(email, otp);

    console.log(`[Password] OTP sent to ${email}`);
    res.json({ message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('[Password] Send OTP error:', err.message);
    res.status(500).json({ error: 'Server error while sending OTP' });
  }
}

export async function verifyOTP(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required' });
      return;
    }

    // Check OTP in memory
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
      res.status(400).json({ error: 'OTP not found or expired' });
      return;
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(email);
      res.status(400).json({ error: 'OTP has expired' });
      return;
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    console.log(`[Password] OTP verified for ${email}`);
    res.json({ message: 'OTP verified successfully' });
  } catch (err: any) {
    console.error('[Password] Verify OTP error:', err.message);
    res.status(500).json({ error: 'Server error while verifying OTP' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'Email, OTP, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Verify OTP first
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
      res.status(400).json({ error: 'OTP not found or expired' });
      return;
    }

    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(email);
      res.status(400).json({ error: 'OTP has expired' });
      return;
    }

    if (storedData.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    // Hash new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Clear OTP from memory
    otpStorage.delete(email);

    console.log(`[Password] Password reset for ${email}`);
    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('[Password] Reset password error:', err.message);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
}
