import express from 'express';
import {
  createOrder,
  verifyPayment,
  getHighProbabilityReports,
  updateReportData
} from '../controllers/razorpayController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from './adminRoutes.js';

const router = express.Router();

// Payment endpoints protected with user JWT authentication
router.post('/create-order', authMiddleware, createOrder);

// Verify payment after completion
router.post('/verify', authMiddleware, verifyPayment);

// Update report data after analysis
router.post('/update-report', authMiddleware, updateReportData);

// Get high probability reports for admin (sensitive PII — restricted to admins only)
router.get('/high-probability-reports', authMiddleware, requireAdmin, getHighProbabilityReports);

export default router;