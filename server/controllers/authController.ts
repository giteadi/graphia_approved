import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sendWelcomeEmail } from '../config/email.js';

const env = process.env.NODE_ENV;
const isDevLike = env === 'development' || env === 'test';
const secret = process.env.JWT_SECRET;
const weak = !secret || secret.length < 32 || /YOUR_|dev_secret|changeme/i.test(secret);

if (weak && !isDevLike) {
  console.error('[Auth] FATAL: Strong JWT_SECRET (32+ chars) required.');
  process.exit(1);
}
export const JWT_SECRET = secret || 'dev_secret_for_local_testing_only';
const JWT_EXPIRES = '30d'; // 30 days token expiry

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, mobile } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(normalizedEmail)) {
    res.status(403).json({ error: 'Direct registration is restricted for administrative accounts.' });
    return;
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)',
      [name, normalizedEmail, hashed, mobile || null]
    );

    const userId = (result as any).insertId;
    const token = jwt.sign({ userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
      console.log(`[Auth] Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('[Auth] Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    console.log(`[Auth] Registered: ${email}`);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, name, email, mobile },
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const users = await query<any>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    console.log(`[Auth] Login: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
}
