import { Router, Response, NextFunction } from 'express';
import { getAllPayments, getPaymentStats, createPayment, updatePaymentStatus, getHighProbabilityUsers } from '../controllers/adminController.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const adminEmails = getAdminEmails();
  const userEmail = (req.userEmail || '').toLowerCase();
  if (adminEmails.length === 0 || !userEmail || !adminEmails.includes(userEmail)) {
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
