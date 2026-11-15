import { Router, Response, NextFunction } from 'express';
import { getAllPayments, getPaymentStats, createPayment, updatePaymentStatus, getHighProbabilityUsers } from '../controllers/adminController.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@graphiacheck.in,aditya@graphiacheck.in')
  .split(',')
  .map(e => e.trim().toLowerCase());

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const userEmail = (req.userEmail || '').toLowerCase();
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
}

router.use(authMiddleware);
router.use(requireAdmin);

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
