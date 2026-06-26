import { Router } from 'express';
import { getAllPayments, getPaymentStats, createPayment, updatePaymentStatus, getHighProbabilityUsers } from '../controllers/adminController.js';

const router = Router();

// Get all payments with filters
router.get('/payments', getAllPayments);

// Get payment statistics
router.get('/payments/stats', getPaymentStats);

// Create a new payment
router.post('/payments', createPayment);

// Update payment status
router.patch('/payments/:id/status', updatePaymentStatus);

// Get high probability users for follow-up
router.get('/high-probability-users', getHighProbabilityUsers);

export default router;
