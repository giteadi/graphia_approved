import { Request, Response } from 'express';
import { query } from '../config/db.js';

export async function getAllPayments(req: Request, res: Response): Promise<void> {
  try {
    const { status, payment_method, search, day, month, year } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(u.mobile, 'N/A') as user_mobile,
        p.amount,
        p.currency,
        p.status,
        p.payment_method,
        p.description,
        DATE(p.payment_date) as payment_date,
        p.created_at
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Status filter
    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    // Payment method filter
    if (payment_method && payment_method !== 'all') {
      sql += ' AND p.payment_method = ?';
      params.push(payment_method);
    }

    // Search filter (name, email, payment ID)
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR p.id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Date filters
    if (day) {
      sql += ' AND DAY(p.payment_date) = ?';
      params.push(day);
    }
    if (month) {
      sql += ' AND MONTH(p.payment_date) = ?';
      params.push(month);
    }
    if (year) {
      sql += ' AND YEAR(p.payment_date) = ?';
      params.push(year);
    }

    sql += ' ORDER BY p.payment_date DESC';

    const payments = await query<any>(sql, params);

    // Format the response to match the frontend interface
    const formattedPayments = payments.map((p: any) => {
      // Extract phone from user mobile or from description if stored there
      let extractedPhone = p.user_mobile;
      if (p.description && p.description.includes('|')) {
        const parts = p.description.split('|').map((part: string) => part.trim());
        if (parts.length > 1) {
          extractedPhone = parts[1]; // Second part might be phone
        }
      }
      
      return {
        id: `PAY${String(p.id).padStart(3, '0')}`,
        userName: p.user_name,
        userEmail: p.user_email,
        userMobile: extractedPhone || p.user_mobile || 'N/A',
        amount: parseFloat(p.amount),
        currency: p.currency,
        date: p.payment_date,
        status: p.status,
        paymentMethod: p.payment_method,
        description: p.description
      };
    });

    res.json(formattedPayments);
  } catch (err: any) {
    console.error('[Admin] Get payments error:', err.message);
    res.status(500).json({ error: 'Server error while fetching payments' });
  }
}

export async function getPaymentStats(req: Request, res: Response): Promise<void> {
  try {
    // Get total revenue
    const totalRevenue = await query<any>(
      'SELECT SUM(amount) as total FROM payments WHERE status = "completed"'
    );

    // Get payment count by status
    const statusCounts = await query<any>(
      'SELECT status, COUNT(*) as count FROM payments GROUP BY status'
    );

    // Get payment method distribution
    const methodCounts = await query<any>(
      'SELECT payment_method, COUNT(*) as count FROM payments GROUP BY payment_method'
    );

    // Get recent payments (last 7 days)
    const recentPayments = await query<any>(
      `SELECT COUNT(*) as count, SUM(amount) as total 
       FROM payments 
       WHERE status = 'completed' 
       AND payment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      statusCounts: statusCounts.reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      methodCounts: methodCounts.reduce((acc: any, row: any) => {
        acc[row.payment_method] = row.count;
        return acc;
      }, {}),
      recentPayments: {
        count: recentPayments[0]?.count || 0,
        total: recentPayments[0]?.total || 0
      }
    });
  } catch (err: any) {
    console.error('[Admin] Get stats error:', err.message);
    res.status(500).json({ error: 'Server error while fetching stats' });
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, amount, currency = 'USD', status = 'pending', payment_method, description, payment_date } = req.body;

    if (!user_id || !amount) {
      res.status(400).json({ error: 'user_id and amount are required' });
      return;
    }

    const result = await query(
      `INSERT INTO payments (user_id, amount, currency, status, payment_method, description, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, amount, currency, status, payment_method, description, payment_date || new Date()]
    );

    const paymentId = (result as any).insertId;

    console.log(`[Admin] Payment created: ID ${paymentId} for user ${user_id}`);
    res.status(201).json({
      message: 'Payment created successfully',
      paymentId
    });
  } catch (err: any) {
    console.error('[Admin] Create payment error:', err.message);
    res.status(500).json({ error: 'Server error while creating payment' });
  }
}

export async function updatePaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['completed', 'pending', 'failed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await query(
      'UPDATE payments SET status = ? WHERE id = ?',
      [status, id]
    );

    console.log(`[Admin] Payment ${id} status updated to ${status}`);
    res.json({ message: 'Payment status updated successfully' });
  } catch (err: any) {
    console.error('[Admin] Update payment status error:', err.message);
    res.status(500).json({ error: 'Server error while updating payment status' });
  }
}

export async function getHighProbabilityUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await query<any>(
      `SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        u.mobile as userMobile,
        r.id as id,
        r.grade,
        r.probability,
        r.student_name as studentName,
        r.student_age as studentAge,
        r.contact_info as contactInfo,
        r.created_at as reportDate,
        r.is_high_probability as isHighProbability,
        p.status as paymentStatus
       FROM users u
       JOIN reports r ON u.id = r.user_id
       LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed'
       WHERE r.is_high_probability = TRUE
       ORDER BY r.created_at DESC`
    );

    // Parse contact_info to extract phone number if available
    const formattedUsers = users.map((user: any) => {
      let extractedPhone = user.userMobile;
      if (user.contactInfo && user.contactInfo.includes('|')) {
        const parts = user.contactInfo.split('|').map((p: string) => p.trim());
        // Format: "email | phone" or "email | phone"
        if (parts.length > 1) {
          extractedPhone = parts[1]; // Second part is phone
        }
      }
      return {
        ...user,
        userMobile: extractedPhone || user.userMobile || 'N/A'
      };
    });

    res.json(formattedUsers);
  } catch (err: any) {
    console.error('[Admin] Get high probability users error:', err.message);
    res.status(500).json({ error: 'Server error while fetching high probability users' });
  }
}
