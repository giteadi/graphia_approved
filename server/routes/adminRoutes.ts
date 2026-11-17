import { Router, Response, NextFunction } from 'express';
import { 
  getAllPayments, 
  getPaymentStats, 
  createPayment, 
  updatePaymentStatus, 
  getHighProbabilityUsers,
  bulkDeletePayments,
  bulkDeleteHighProbabilityUsers
} from '../controllers/adminController.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { query } from '../config/db.js';

const router = Router();

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminEmails = getAdminEmails();
    let userEmail = (req.userEmail || '').toLowerCase().trim();

    // Fallback: If userEmail was not in the JWT token, look it up via userId
    if (!userEmail && req.userId) {
      const rows = await query<any>('SELECT email FROM users WHERE id = ?', [req.userId]);
      if (rows.length > 0 && rows[0].email) {
        userEmail = String(rows[0].email).toLowerCase().trim();
        req.userEmail = userEmail;
      }
    }

    const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);

    if (!userEmail || !isAdmin) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Server error during admin verification' });
  }
}

router.use(authMiddleware);
router.use(requireAdmin);

// Get all payments with filters
router.get('/payments', getAllPayments);

// Get payment statistics
router.get('/payments/stats', getPaymentStats);

// Create a new payment
router.post('/payments', createPayment);

// Bulk delete payments
router.delete('/payments/bulk-delete', bulkDeletePayments);

// Update payment status
router.patch('/payments/:id/status', updatePaymentStatus);

// Get high probability users for follow-up
router.get('/high-probability-users', getHighProbabilityUsers);

// Bulk delete high probability user reports
router.delete('/high-probability-users/bulk-delete', bulkDeleteHighProbabilityUsers);

export default router;
