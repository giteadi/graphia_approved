import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../config/db.js';

// Razorpay instance using environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RuZlqciKwvcmLJ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '60bnM5xSBYo6RYdz2FWBtob0',
});

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Razorpay] createOrder called with req.body:', JSON.stringify(req.body));
    const { amount, currency = 'INR', receipt, description } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
      return;
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment immediately (1 = true)
      notes: {
        description: description || 'GraphiaCheck Report Generation Fee'
      }
    };

    console.log('[Razorpay] Creating order with options:', JSON.stringify(options));
    const order = await razorpay.orders.create(options);

    console.log(`[Razorpay] Order created: ${order.id} for amount ${amount}`);

    // Return response in Pyment.md format
    res.json({
      success: true,
      data: {
        id: order.id,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_live_RuZlqciKwvcmLJ', // Live key for frontend
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (err: any) {
    console.error('[Razorpay] Create order error:', err);
    console.error('[Razorpay] Error message:', err?.message);
    console.error('[Razorpay] Error stack:', err?.stack);
    console.error('[Razorpay] Full error object:', JSON.stringify(err, null, 2));
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      report_data,
      amount,
      description
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing payment verification parameters' 
      });
      return;
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');
    
    // Hardcoded secret fallback (commented out - use .env file)
    // const secret = 'ypHPglfRsPwivHvtG2S4YO34'; // GraphiaCheck Shop - New Secret (Hardcoded)

    if (generatedSignature !== razorpay_signature) {
      console.error('[Razorpay] Signature verification failed');
      res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
      return;
    }

    // Store payment in database
    const paymentAmount = amount || 899.00;
    const paymentResult = await query(
      `INSERT INTO payments (user_id, amount, currency, status, payment_method, description, payment_date)
       VALUES (?, ?, 'INR', 'completed', 'razorpay', ?, NOW())`,
      [user_id, paymentAmount, description || 'Report Generation Fee']
    );

    const paymentId = (paymentResult as any).insertId;
    console.log(`[Razorpay] Payment stored: ID ${paymentId}, User ID ${user_id}`);

    // Check if report data contains high probability
    const probability = report_data?.probability || 'Unknown';
    const isHighProbability = probability.toLowerCase().includes('high');

    // Store report with probability information
    await query(
      `INSERT INTO reports (user_id, grade, report_text, probability, is_high_probability, student_name, student_age, contact_info, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id,
        report_data?.grade || 'Unknown',
        JSON.stringify(report_data),
        probability,
        isHighProbability,
        report_data?.studentName || null,
        report_data?.age || null,
        report_data?.contactEmail || null
      ]
    );

    console.log(`[Razorpay] Payment verified and stored: Payment ID ${paymentId}, User ID ${user_id}, High Probability: ${isHighProbability}`);

    res.json({
      success: true,
      data: {
        paymentId,
        isHighProbability,
        message: 'Payment verified successfully'
      }
    });
  } catch (err: any) {
    console.error('[Razorpay] Verify payment error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment' 
    });
  }
}

export async function updateReportData(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, probability, summary, scores } = req.body;

    if (!user_id) {
      res.status(400).json({ 
        success: false, 
        message: 'User ID required' 
      });
      return;
    }

    // Update the latest report for this user with probability and analysis results
    const result = await query(
      `UPDATE reports 
       SET probability = ?, 
           is_high_probability = ?,
           report_text = JSON_FORMAT(JSON_SET(
             JSON_UNQUOTE(report_text),
             '$.summary', ?,
             '$.scores', ?
           ))
       WHERE user_id = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [
        probability || 'Unknown',
        (probability || '').toLowerCase().includes('high') ? 1 : 0,
        JSON.stringify(summary),
        JSON.stringify(scores),
        user_id
      ]
    );

    console.log(`[Razorpay] Report updated for User ID ${user_id}, Probability: ${probability}`);
    res.json({ 
      success: true, 
      data: { message: 'Report updated successfully' } 
    });
  } catch (err: any) {
    console.error('[Razorpay] Update report error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update report' 
    });
  }
}

export async function getHighProbabilityReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await query<any>(
      `SELECT 
        r.id,
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.grade,
        r.report_text,
        r.probability,
        r.is_high_probability,
        r.student_name,
        r.student_age,
        r.contact_info,
        r.created_at as report_date,
        p.status as payment_status
       FROM reports r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN payments p ON r.user_id = p.user_id AND p.status = 'completed'
       WHERE r.is_high_probability = TRUE
       ORDER BY r.created_at DESC`
    );

    // Format the reports with additional information
    const formattedReports = reports.map((report: any) => {
      try {
        const reportData = JSON.parse(report.report_text);
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.user_name,
          userEmail: report.user_email,
          studentName: report.student_name,
          studentAge: report.student_age,
          contactInfo: report.contact_info,
          grade: report.grade,
          probability: report.probability || reportData.probability || 'Unknown',
          isHighProbability: report.is_high_probability,
          reportDate: report.report_date,
          paymentStatus: report.payment_status,
          summary: reportData.summary
        };
      } catch {
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.user_name,
          userEmail: report.user_email,
          studentName: report.student_name,
          studentAge: report.student_age,
          contactInfo: report.contact_info,
          grade: report.grade,
          probability: report.probability || 'Unknown',
          isHighProbability: report.is_high_probability,
          reportDate: report.report_date,
          paymentStatus: report.payment_status,
          summary: null
        };
      }
    });

    res.json({
      success: true,
      data: formattedReports
    });
  } catch (err: any) {
    console.error('[Razorpay] Get high probability reports error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch high probability reports' 
    });
  }
}