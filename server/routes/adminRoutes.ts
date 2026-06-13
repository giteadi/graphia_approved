import { Router } from 'express';
import { getAllPayments, getPaymentStats, createPayment, updatePaymentStatus } from '../controllers/adminController.js';

const router = Router();

// Get all payments with filters
router.get('/payments', getAllPayments);

// Get payment statistics
router.get('/payments/stats', getPaymentStats);

// Create a new payment
router.post('/payments', createPayment);

// Update payment status
router.patch('/payments/:id/status', updatePaymentStatus);

export default router;
