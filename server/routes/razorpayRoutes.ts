import express from 'express';
import {
  createOrder,
  verifyPayment,
  getHighProbabilityReports,
  updateReportData
} from '../controllers/razorpayController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from './adminRoutes.js';

const router = express.Router();

// Order creation uses optional auth so customers are never blocked with 401 when initiating payment
router.post('/create-order', optionalAuthMiddleware, createOrder);

// Verify payment after completion (uses optional auth so verified Razorpay transactions are never dropped)
router.post('/verify', optionalAuthMiddleware, verifyPayment);

// Update report data after analysis
router.post('/update-report', optionalAuthMiddleware, updateReportData);

// Get high probability reports for admin (sensitive PII — restricted to admins only)
router.get('/high-probability-reports', authMiddleware, requireAdmin, getHighProbabilityReports);

export default router;