import express from 'express';
import {
  createOrder,
  verifyPayment,
  getHighProbabilityReports,
  updateReportData
} from '../controllers/razorpayController.js';
import { apiAuth } from '../middleware/apiAuth.js';

const router = express.Router();

// Create Razorpay order (with API authentication)
router.post('/create-order', apiAuth, createOrder);

// Verify payment after completion (with API authentication)
router.post('/verify', apiAuth, verifyPayment);

// Update report data after analysis (with API authentication)
router.post('/update-report', apiAuth, updateReportData);

// Get high probability reports for admin (with API authentication)
router.get('/high-probability-reports', apiAuth, getHighProbabilityReports);

export default router;