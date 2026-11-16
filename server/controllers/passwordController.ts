import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { sendOTPEmail, generateOTP } from '../config/email.js';

interface OTPRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// In-memory OTP storage with rate limiting and attempt limits
const otpStorage = new Map<string, OTPRecord>();
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function sendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (generic response prevents email enumeration)
    const users = await query<any>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      res.json({ message: 'If this email is registered, a verification code has been sent.' });
      return;
    }

    // Cooldown check (60s)
    const existing = otpStorage.get(normalizedEmail);
    if (existing && (Date.now() - existing.lastSentAt) < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
      res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting a new OTP` });
      return;
    }

    // Generate cryptographically secure OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_TTL_MS;

    // Store OTP in memory
    otpStorage.set(normalizedEmail, { otp, expiresAt, attempts: 0, lastSentAt: Date.now() });

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp);

    console.log(`[Password] OTP sent to ${normalizedEmail}`);
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

    const normalizedEmail = email.toLowerCase().trim();
    const storedData = otpStorage.get(normalizedEmail);
    
    if (!storedData) {
      res.status(400).json({ error: 'OTP not found or expired' });
      return;
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(normalizedEmail);
      res.status(400).json({ error: 'OTP has expired' });
      return;
    }

    // Max attempt limit
    if (storedData.attempts >= MAX_ATTEMPTS) {
      otpStorage.delete(normalizedEmail);
      res.status(429).json({ error: 'Too many invalid attempts. Please request a new OTP.' });
      return;
    }

    // Constant-time verify OTP
    if (!safeCompare(storedData.otp, String(otp).trim())) {
      storedData.attempts += 1;
      const remaining = MAX_ATTEMPTS - storedData.attempts;
      if (remaining <= 0) {
        otpStorage.delete(normalizedEmail);
        res.status(400).json({ error: 'Too many invalid attempts. OTP invalidated.' });
      } else {
        res.status(400).json({ error: `Invalid OTP. ${remaining} attempt(s) remaining.` });
      }
      return;
    }

    console.log(`[Password] OTP verified for ${normalizedEmail}`);
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

    const normalizedEmail = email.toLowerCase().trim();
    const storedData = otpStorage.get(normalizedEmail);
    
    if (!storedData) {
      res.status(400).json({ error: 'OTP not found or expired' });
      return;
    }

    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(normalizedEmail);
      res.status(400).json({ error: 'OTP has expired' });
      return;
    }

    if (storedData.attempts >= MAX_ATTEMPTS) {
      otpStorage.delete(normalizedEmail);
      res.status(429).json({ error: 'Too many invalid attempts. Please request a new OTP.' });
      return;
    }

    if (!safeCompare(storedData.otp, String(otp).trim())) {
      storedData.attempts += 1;
      const remaining = MAX_ATTEMPTS - storedData.attempts;
      if (remaining <= 0) {
        otpStorage.delete(normalizedEmail);
        res.status(400).json({ error: 'Too many invalid attempts. OTP invalidated.' });
      } else {
        res.status(400).json({ error: `Invalid OTP. ${remaining} attempt(s) remaining.` });
      }
      return;
    }

    // Hash new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, normalizedEmail]);

    // Clear OTP from memory
    otpStorage.delete(normalizedEmail);

    console.log(`[Password] Password reset for ${normalizedEmail}`);
    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('[Password] Reset password error:', err.message);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
}
