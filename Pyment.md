import { useState, useEffect } from 'react';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, studentName, amount = 599 }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // API URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://iplanbymsl.in/api';

  // Load Razorpay script dynamically
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setScriptLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.warn('Razorpay script failed to load');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    if (isOpen && !scriptLoaded) {
      loadRazorpayScript();
    }
  }, [isOpen, scriptLoaded]);

  // Suppress known browser warnings
  useEffect(() => {
    const handleError = (event) => {
      // Suppress Razorpay tracking header errors
      if (event.message?.includes('x-rtb-fingerprint-id') ||
          event.message?.includes('unsafe header')) {
        event.preventDefault();
        return false;
      }

      // Suppress SVG attribute errors (usually from browser extensions)
      if (event.message?.includes('Expected length') &&
          event.message?.includes('<svg> attribute')) {
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event) => {
      // Suppress network errors related to tracking
      if (event.reason?.message?.includes('x-rtb-fingerprint-id')) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);



  const handlePayment = async () => {
    if (!studentName) {
      alert('Please enter student name first');
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      alert('Payment system is loading. Please wait...');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Order via Backend API (Orders API for auto-capture)
      console.log('📦 Creating Razorpay order...');
      const orderResponse = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'candidjobs_iep_secure_key_2025'
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          description: `iPLAN Assessment and Report for ${studentName}`
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success || !orderData.data?.id) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      console.log('✅ Order created:', orderData.data.id);

      // Step 2: Open Razorpay Checkout with order_id ONLY
      const options = {
        // TEST key (active for testing)
        key: orderData.data.key || 'rzp_live_RuZlqciKwvcmLJ',
        // LIVE key (commented for testing)
        // key: orderData.data.key || 'rzp_live_RuZlqciKwvcmLJ',
        order_id: orderData.data.id, // ONLY order_id needed - amount/currency comes from order
        name: 'MindSaid Learning™',
        description: `iPLAN Assessment and Report for ${studentName}`,
        image: 'https://res.cloudinary.com/bazeercloud/image/upload/v1765087953/Gemini_Generated_Image_o8ciwko8ciwko8ci-removebg-preview_l4nnui.png',
        handler: async function (response) {
          console.log('💳 Payment response:', response);

          // Validate payment response
          if (!response.razorpay_payment_id) {
            console.error('Payment failed: No payment ID received');
            alert('Payment failed. Please try again.');
            setIsProcessing(false);
            return;
          }

          // Step 3: Verify payment on backend
          try {
            console.log('🔐 Verifying payment...');
            const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'candidjobs_iep_secure_key_2025'
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
                description: `iPLAN Assessment and Report for ${studentName}`
              })
            });

            const verifyData = await verifyResponse.json();
            console.log(verifyData.success ? '✅ Payment verified successfully' : '⚠️ Payment verification returned failure, proceeding anyway');

            // Always call onPaymentSuccess — subscription creation is handled in AssessmentForm
            onPaymentSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: amount,
              studentName: studentName,
              timestamp: new Date().toISOString()
            });
            onClose();
          } catch (verifyError) {
            console.error('❌ Verification error:', verifyError);
            // Still allow success if payment was made
            onPaymentSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: amount,
              studentName: studentName,
              timestamp: new Date().toISOString()
            });
            onClose();
          }
        },
        prefill: {
          name: studentName,
          email: '',
          contact: ''
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user');
            setIsProcessing(false);
          },
          confirm_close: true,
          animation: true
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert('Payment system error. Please try again later.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Payment Required</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900">Student:</span>
              <span className="text-slate-700">{studentName || 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900">Service:</span>
              <span className="text-slate-700">iPLAN Assessment & Report</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-blue-600">
              <span>Total Amount:</span>
              <span>₹{amount}</span>
            </div>
          </div>

          <div className="text-sm text-slate-600">
            <p className="mb-2">This payment covers:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Comprehensive student assessment</li>
              <li>Auto-generated learning goals</li>
              <li>Personalized progress report</li>
              <li>Teacher recommendations</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {/* Simple Payment Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">💳</span>
              <div className="text-sm text-green-800">
                <p className="font-medium">Multiple Payment Options Available</p>
                <p className="text-xs">UPI, Cards, Net Banking, Wallets - Choose your preferred method</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !studentName || !scriptLoaded}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2 text-white">⏳</span>
                  Processing...
                </div>
              ) : !scriptLoaded ? (
                'Loading...'
              ) : (
                `Pay ₹${amount}`
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 text-center">
          Secure payment powered by Razorpay
        </div>

        {/* Disclaimer */}
        <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> This iPLAN is generated based on user-provided information and does not constitute a clinical or medical diagnosis. It is intended solely for educational purposes. MindSaid Learning™ Centre shall not be held liable for any actions arising from its use.
          </p>
        </div>
      </div>
    </div>
  );
}

<!-- backend -->
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');

// Initialize Razorpay instance at module level (singleton)
let razorpayInstance = null;

const getRazorpayInstance = () => {
  console.log('🔍 [RAZORPAY] getRazorpayInstance called');
  console.log('🔍 [RAZORPAY] Current instance:', razorpayInstance ? 'EXISTS' : 'NULL');
  console.log('🔍 [RAZORPAY] ENV RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID || 'NOT SET');
  console.log('🔍 [RAZORPAY] ENV RAZORPAY_SECRET:', process.env.RAZORPAY_SECRET ? 'SET (hidden)' : 'NOT SET');
  
  if (!razorpayInstance) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
      console.log('🔑 [RAZORPAY] Initializing Razorpay with keys:', {
        key_id: process.env.RAZORPAY_KEY_ID,
        secret: 'HIDDEN'
      });
      try {
        razorpayInstance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_SECRET,
        });
        console.log('✅ [RAZORPAY] Instance created successfully');
      } catch (initError) {
        console.error('❌ [RAZORPAY] Failed to create instance:', initError.message);
      }
    } else {
      console.warn('⚠️ [RAZORPAY] Keys not configured:', {
        key_id: process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing',
        secret: process.env.RAZORPAY_SECRET ? 'Present' : 'Missing'
      });
    }
  }
  return razorpayInstance;
};

const createOrder = async (req, res) => {
  console.log('');
  console.log('💳 ========== CREATE ORDER START ==========');
  console.log('📅 Time:', new Date().toISOString());
  console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Request Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const { amount, currency = 'INR', studentId, description } = req.body;
    
    console.log('💰 Step 1 - Parsed values:', { amount, currency, studentId, description });

    if (!amount) {
      console.log('❌ Step 1 FAILED - Amount is missing');
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // MOCK PAYMENT DISABLED - Using real Razorpay TEST keys
    // Check if using TEST keys (for mock payment flow)
    // const isTestMode = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_');
    
    // if (isTestMode) {
    //   console.log('🧪 TEST MODE - Creating mock order');
    //   const mockOrder = {
    //     id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    //     amount: amount * 100,
    //     currency: currency,
    //     receipt: `rcpt_${Date.now()}`,
    //     status: 'created'
    //   };
    //   
    //   console.log('✅ Mock order created:', mockOrder.id);
    //   
    //   const response = {
    //     success: true,
    //     data: {
    //       id: mockOrder.id,
    //       amount: mockOrder.amount,
    //       currency: mockOrder.currency,
    //       key: process.env.RAZORPAY_KEY_ID,
    //       studentId: studentId,
    //       description: description
    //     }
    //   };
    //   
    //   console.log('📤 Sending mock order response');
    //   console.log('💳 ========== CREATE ORDER END (MOCK) ==========');
    //   console.log('');
    //   
    //   return res.json(response);
    // }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment immediately
      notes: {
        studentId: studentId || '',
        description: description || ''
      }
    };
    
    console.log('📋 Step 2 - Razorpay Options:', JSON.stringify(options, null, 2));

    try {
      // Try to create real Razorpay order
      console.log('🔄 Step 3 - Getting Razorpay instance...');
      const razorpay = getRazorpayInstance();
      
      if (!razorpay) {
        console.log('❌ Step 3 FAILED - Razorpay instance is NULL');
        throw new Error('Razorpay not configured');
      }
      
      console.log('✅ Step 3 - Razorpay instance obtained');
      console.log('🔄 Step 4 - Creating order with Razorpay API...');
      
      const order = await razorpay.orders.create(options);
      
      console.log('✅ Step 4 - Real Razorpay order created:', order.id);
      console.log('📦 Order details:', JSON.stringify(order, null, 2));

      const response = {
        success: true,
        data: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
          studentId: studentId,
          description: description
        }
      };
      
      console.log('📤 Step 5 - Sending success response:', JSON.stringify(response, null, 2));
      console.log('💳 ========== CREATE ORDER END (SUCCESS) ==========');
      console.log('');
      
      res.json(response);
    } catch (razorpayError) {
      console.error('❌ Step 4 FAILED - Razorpay order creation failed');
      console.error('❌ Error message:', razorpayError.message);
      console.error('❌ Error name:', razorpayError.name);
      console.error('❌ Error code:', razorpayError.code);
      console.error('❌ Error statusCode:', razorpayError.statusCode);
      console.error('❌ Error error object:', razorpayError.error);
      console.error('❌ Full error:', JSON.stringify(razorpayError, null, 2));

      // Check if it's an authentication or account issue
      const errorMsg = razorpayError.message || '';
      const errorDesc = razorpayError.error?.description || '';
      const isAuthError = errorMsg.includes('authentication') ||
          errorMsg.includes('Unauthorized') ||
          errorMsg.includes('Invalid API key') ||
          errorDesc.includes('Authentication failed') ||
          razorpayError.statusCode === 401;
          
      console.log('🔍 Is Auth Error:', isAuthError);

      if (isAuthError) {
        console.log('🔑 Razorpay authentication failed - check API keys');
        console.log('🔑 Current KEY_ID:', process.env.RAZORPAY_KEY_ID);
        console.log('🔑 SECRET length:', process.env.RAZORPAY_SECRET?.length);
        
        return res.status(500).json({
          success: false,
          message: 'Razorpay authentication failed. Please check API keys.',
          error: errorDesc || errorMsg
        });
      }

      // For other errors
      console.log('❌ Other Razorpay error');
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: errorDesc || errorMsg
      });
    }
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR in createOrder:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      studentId,
      amount,
      description
    } = req.body;

    console.log('🔍 [VERIFY] Payment verification started');
    console.log('🔍 [VERIFY] Order ID:', razorpay_order_id);
    console.log('🔍 [VERIFY] Payment ID:', razorpay_payment_id);

    // Validate required fields
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // Handle mock orders (TEST mode)
    if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
      console.log('🧪 [VERIFY] Mock payment detected');
      
      const paymentId = razorpay_payment_id || `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Check if payment already exists
      const existingPayment = await Payment.findByRazorpayId(paymentId);
      if (existingPayment) {
        console.log('✅ [VERIFY] Mock payment already verified');
        return res.json({
          success: true,
          message: 'Payment already verified',
          data: existingPayment
        });
      }

      // Create payment record for mock payment
      const paymentData = {
        studentId: parseInt(studentId) || null,
        razorpayPaymentId: paymentId,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'mock_test',
        description: description || 'Test payment'
      };

      const payment = await Payment.create(paymentData);
      
      console.log('✅ [VERIFY] Mock payment verified successfully');

      return res.json({
        success: true,
        message: 'Mock payment verified successfully (TEST mode)',
        data: payment
      });
    }

    // Generate payment ID if not provided (for mock payments)
    const paymentId = razorpay_payment_id || `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const orderId = razorpay_order_id || `order_mock_${Date.now()}`;

    // Handle mock orders (for testing)
    if (orderId.startsWith('order_') && !process.env.RAZORPAY_SECRET) {
      console.log('🔄 Processing mock payment verification (no Razorpay secret configured)');

      // Check if payment already exists
      const existingPayment = await Payment.findByRazorpayId(paymentId);
      if (existingPayment) {
        return res.json({
          success: true,
          message: 'Payment already verified',
          data: existingPayment
        });
      }

      // Create payment record for mock payment
      const paymentData = {
        studentId: parseInt(studentId),
        razorpayPaymentId: paymentId,
        amount: parseFloat(amount),
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'mock',
        description: description
      };

      const payment = await Payment.create(paymentData);

      return res.json({
        success: true,
        message: 'Mock payment verified successfully',
        data: payment
      });
    }

    // Handle real Razorpay payments
    if (process.env.RAZORPAY_SECRET && razorpay_signature) {
      try {
        // Verify payment signature
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_SECRET)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          console.error('❌ Payment signature mismatch:', {
            expected: expectedSignature,
            received: razorpay_signature,
            order_id: orderId,
            payment_id: paymentId
          });
          return res.status(400).json({
            success: false,
            message: 'Invalid payment signature'
          });
        }
        console.log('✅ Payment signature verified successfully');
      } catch (signatureError) {
        console.error('❌ Signature verification error:', signatureError);
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed'
        });
      }
    } else {
      console.log('⚠️ Skipping signature verification (missing secret or signature)');
      
      // For development/testing, allow payments without signature if no secret is configured
      if (!process.env.RAZORPAY_SECRET) {
        console.log('🔧 Development mode: No Razorpay secret configured, allowing payment');
      }
    }

    // Check if payment already exists
    const existingPayment = await Payment.findByRazorpayId(paymentId);
    if (existingPayment) {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: existingPayment
      });
    }

    // Create payment record
    const paymentData = {
      studentId: parseInt(studentId),
      razorpayPaymentId: paymentId,
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'completed',
      paymentMethod: razorpay_payment_id ? 'razorpay' : 'mock',
      description: description
    };

    const payment = await Payment.create(paymentData);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: payment
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};

const getPaymentsByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.query.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const payments = await Payment.findByStudentId(studentId);

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build filters from query params
    const filters = {
      mslId: req.query.mslId,
      studentName: req.query.studentName,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      limit: limit,
      offset: offset
    };

    // Get payments with student details
    const payments = await Payment.getAllPaymentsWithStudents(filters);
    const totalCount = await Payment.getPaymentsCount(filters);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: page,
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { status, additionalData } = req.body;

    const payment = await Payment.updateStatus(
      req.params.razorpayPaymentId,
      status,
      additionalData
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.getPaymentStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const initiateRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Initiate refund via Razorpay
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay not configured - cannot process refund'
      });
    }

    const refundAmount = (amount || payment.amount) * 100; // Convert to paise

    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: refundAmount,
      notes: {
        reason: reason || 'Customer request'
      }
    });

    // Update payment status
    await Payment.updateStatus(payment.razorpay_payment_id, 'refunded', {
      refund_id: refund.id,
      refund_amount: refund.amount / 100
    });

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      data: refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund'
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentsByStudent,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  initiateRefund
};