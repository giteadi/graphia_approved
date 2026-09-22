import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query } from '../config/db.js';

// ── Razorpay clients ──────────────────────────────────────────────────────────
// Live keys charge real money. Test keys let admins walk the full payment flow
// without a real charge — those payments are flagged and excluded from revenue.
const LIVE_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const LIVE_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const TEST_KEY_ID     = process.env.RAZORPAY_TEST_KEY_ID;
const TEST_KEY_SECRET = process.env.RAZORPAY_TEST_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: LIVE_KEY_ID,
  key_secret: LIVE_KEY_SECRET,
});

const razorpayTest = TEST_KEY_ID && TEST_KEY_SECRET
  ? new Razorpay({ key_id: TEST_KEY_ID, key_secret: TEST_KEY_SECRET })
  : null;

/** Accounts allowed to pay with test keys. Comma-separated in TEST_PAYMENT_EMAILS. */
const TEST_PAYMENT_EMAILS = (process.env.TEST_PAYMENT_EMAILS || 'admin@graphiacheck.in')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

function requesterEmail(req: Request): string {
  return String(req.headers['x-user-email'] || req.body?.user_email || '')
    .toLowerCase()
    .trim();
}

/** True when this request should go through Razorpay test mode. */
function useTestMode(req: Request): boolean {
  if (!razorpayTest) return false;
  const email = requesterEmail(req);
  return !!email && TEST_PAYMENT_EMAILS.includes(email);
}

/**
 * Verifies the Razorpay signature against the live secret first, then the test
 * secret. Returns which mode matched, or null when the signature is invalid.
 */
function verifySignatureMode(
  orderId: string,
  paymentId: string,
  signature: string
): 'live' | 'test' | null {
  const body = `${orderId}|${paymentId}`;
  const candidates: Array<{ mode: 'live' | 'test'; secret?: string }> = [
    { mode: 'live', secret: LIVE_KEY_SECRET },
    { mode: 'test', secret: TEST_KEY_SECRET },
  ];

  for (const { mode, secret } of candidates) {
    if (!secret) continue;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return mode;
  }
  return null;
}

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

    const testMode = useTestMode(req);
    const client = testMode ? razorpayTest! : razorpay;
    const keyId = testMode ? TEST_KEY_ID : LIVE_KEY_ID;

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

    console.log(`[Razorpay] Creating order (${testMode ? 'TEST' : 'LIVE'} mode) with options:`, JSON.stringify(options));
    const order = await client.orders.create(options);

    console.log(`[Razorpay] Order created: ${order.id} for amount ${amount} (${testMode ? 'TEST' : 'LIVE'})`);

    // Return response in Pyment.md format
    res.json({
      success: true,
      data: {
        id: order.id,
        key: keyId, // test key for whitelisted admins, live key otherwise
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        mode: testMode ? 'test' : 'live'
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

    // Verify signature against live secret, then test secret
    const signatureMode = verifySignatureMode(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!signatureMode) {
      console.error('[Razorpay] Signature verification failed');
      res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
      return;
    }

    const isTestPayment = signatureMode === 'test';
    if (isTestPayment) {
      console.log(`[Razorpay] TEST-mode payment verified for user ${user_id} — excluded from revenue`);
    }

    // Store payment in database with phone number
    const paymentAmount = amount || 899.00;
    const contactEmail = report_data?.contactEmail || report_data?.contact_info || null;
    const contactPhone = report_data?.contactPhone || null;
    const baseDescription = isTestPayment
      ? `[TEST] ${description || 'Report Generation Fee'}`
      : (description || 'Report Generation Fee');
    const paymentDescription = contactPhone
      ? `${baseDescription} | ${contactEmail || ''} | ${contactPhone}`
      : `${baseDescription} | ${contactEmail || ''}`;

    const paymentResult = await query(
      `INSERT INTO payments (user_id, amount, currency, status, payment_method, description, is_test, payment_date)
       VALUES (?, ?, 'INR', 'completed', 'razorpay', ?, ?, NOW())`,
      [user_id, paymentAmount, paymentDescription, isTestPayment ? 1 : 0]
    );

    const paymentId = (paymentResult as any).insertId;
    console.log(`[Razorpay] Payment stored: ID ${paymentId}, User ID ${user_id}, Mode ${signatureMode}`);

    // Check if report data contains high probability
    const probability = report_data?.probability || 'Unknown';
    const isHighProbability = probability.toLowerCase().includes('high');

    // Combine email and phone for contact_info (reuse variables from above)
    const contactInfo = contactPhone ? `${contactEmail || ''} | ${contactPhone}` : contactEmail;

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
        report_data?.studentName || report_data?.student_name || null,
        report_data?.age || report_data?.student_age || null,
        contactInfo
      ]
    );

    console.log(`[Razorpay] Payment verified and stored: Payment ID ${paymentId}, User ID ${user_id}, High Probability: ${isHighProbability}`);

    res.json({
      success: true,
      data: {
        paymentId,
        isHighProbability,
        isTestPayment,
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

    // Merge in JS rather than with SQL JSON functions — JSON_FORMAT is MariaDB
    // only and threw "FUNCTION does not exist" on MySQL, so this update never
    // actually ran. report_text may also hold narrative text (not JSON), which
    // JSON_SET would have corrupted.
    const rows = await query<any>(
      'SELECT id, report_text FROM reports WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [user_id]
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No report found for this user'
      });
      return;
    }

    const latest = rows[0];
    let reportText: string = latest.report_text;

    try {
      const parsed = JSON.parse(reportText);
      if (parsed && typeof parsed === 'object') {
        parsed.summary = summary;
        parsed.scores = scores;
        reportText = JSON.stringify(parsed);
      }
    } catch {
      // Narrative report text — leave it untouched, only the columns update.
    }

    await query(
      `UPDATE reports
       SET probability = ?, is_high_probability = ?, report_text = ?
       WHERE id = ?`,
      [
        probability || 'Unknown',
        (probability || '').toLowerCase().includes('high') ? 1 : 0,
        reportText,
        latest.id
      ]
    );

    console.log(`[Razorpay] Report ${latest.id} updated for User ID ${user_id}, Probability: ${probability}`);
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
        
        // Extract phone from contact_info if stored as "email | phone"
        let extractedPhone = null;
        if (report.contact_info && report.contact_info.includes('|')) {
          const parts = report.contact_info.split('|').map((p: string) => p.trim());
          if (parts.length > 1) {
            extractedPhone = parts[1]; // Second part is phone
          }
        }
        
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.user_name,
          userEmail: report.user_email,
          userMobile: extractedPhone || null,
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
        // Extract phone from contact_info even if JSON parsing fails
        let extractedPhone = null;
        if (report.contact_info && report.contact_info.includes('|')) {
          const parts = report.contact_info.split('|').map((p: string) => p.trim());
          if (parts.length > 1) {
            extractedPhone = parts[1];
          }
        }
        
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.user_name,
          userEmail: report.user_email,
          userMobile: extractedPhone || null,
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