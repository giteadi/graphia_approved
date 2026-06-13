import { Router } from 'express';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/passwordController.js';

const router = Router();

// Send OTP to email
router.post('/send-otp', sendOTP);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset password with OTP
router.post('/reset-password', resetPassword);

export default router;
