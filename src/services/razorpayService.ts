interface PaymentOrder {
  id: string;
  key: string;
  amount: number;
  currency: string;
  receipt: string;
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  user_id: number;
  report_data: any;
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    escape?: boolean;
    backdrop?: string;
    backdropclose?: boolean;
    ondismiss?: () => void;
    confirm_close?: boolean;
    animation?: boolean;
  };
}

// Initialize Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function createPaymentOrder(amount: number = 899, description?: string): Promise<PaymentOrder> {
  try {
    console.log('[Razorpay] Creating order for amount:', amount);
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const API_KEY = import.meta.env.VITE_API_KEY || 'candidjobs_iep_secure_key_2025';
    
    const response = await fetch(`${API_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ 
        amount, 
        currency: 'INR',
        description: description || 'GraphiaCheck Report Generation Fee'
      }),
    });

    console.log('[Razorpay] Create order response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Razorpay] Create order failed:', errorData);
      throw new Error(errorData.message || 'Failed to create payment order');
    }

    const result = await response.json();
    
    if (!result.success || !result.data?.id) {
      throw new Error(result.message || 'Failed to create payment order');
    }
    
    console.log('[Razorpay] Order created successfully:', result.data.id);
    return result.data;
  } catch (error) {
    console.error('[Razorpay] Create order error:', error);
    throw error;
  }
}

export async function verifyPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  user_id: number,
  report_data: any,
  amount?: number,
  description?: string
): Promise<{ success: boolean; paymentId: number; isHighProbability: boolean }> {
  try {
    console.log("🔥🔥🔥 VERIFY PAYMENT API CALLED 🔥🔥🔥");
    console.log("🔥 Order ID:", razorpay_order_id);
    console.log("🔥 Payment ID:", razorpay_payment_id);
    console.log("🔥 User ID:", user_id);
    
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const API_KEY = import.meta.env.VITE_API_KEY || 'candidjobs_iep_secure_key_2025';
    
    const response = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        user_id,
        report_data,
        amount,
        description
      }),
    });

    console.log("🔥 Verify API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("🔥🔥🔥 VERIFY API FAILED 🔥🔥🔥");
      console.error("🔥 Error data:", errorData);
      throw new Error(errorData.message || 'Payment verification failed');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Payment verification failed');
    }
    
    console.log("🔥🔥🔥 VERIFY API SUCCESS 🔥🔥🔥");
    console.log("🔥 Result:", result);
    return result.data;
  } catch (error) {
    console.error("🔥🔥🔥 VERIFY PAYMENT ERROR 🔥🔥🔥");
    console.error("🔥 Error:", error);
    throw error;
  }
}

export function initiateRazorpayPayment(
  order: PaymentOrder,
  user_id: number,
  report_data: any,
  onSuccess: (result: { paymentId: number; isHighProbability: boolean }) => void,
  onError: (error: string) => void
): void {
  console.log('[Razorpay] Initiating payment with order:', order.id, 'amount:', order.amount);
  
  let paymentSucceeded = false; // Track if payment already succeeded
  let rzpInstance: any = null; // Store Razorpay instance
  
  const options: RazorpayOptions = {
    key: order.key, // Use key from order response (comes from backend)
    name: 'GraphiaCheck',
    description: report_data?.description || 'Report Generation Fee',
    image: 'https://res.cloudinary.com/bazeercloud/image/upload/v1765087953/Gemini_Generated_Image_o8ciwko8ciwko8ci-removebg-preview_l4nnui.png',
    order_id: order.id, // ONLY order_id needed - amount/currency comes from order
    
    // Live key fallback (commented out - use backend key)
    // key: 'rzp_live_RuZlqciKwvcmLJ', // GraphiaCheck Shop - New Live Key (Hardcoded)
    handler: async function (response: any) {
      console.log("🔥🔥🔥 RAZORPAY SUCCESS CALLBACK FIRED 🔥🔥🔥");
      console.log("🔥 Response:", response);
      
      paymentSucceeded = true;
      
      try {
        console.log("🔥 Calling verifyPayment...");
        const result = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          user_id,
          report_data,
          order.amount / 100, // Convert paise to rupees
          report_data?.description
        );
        console.log("🔥🔥 VERIFY SUCCESS RESPONSE:", result);
        
        // Close modal programmatically after successful verification
        if (rzpInstance) {
          rzpInstance.close();
        }
        
        onSuccess(result);
      } catch (error) {
        console.error("🔥🔥🔥 VERIFY FAILED 🔥🔥🔥");
        console.error("🔥 Error:", error);
        onError('Payment verification failed. Please contact support.');
      }
    },
    prefill: {
      name: report_data?.studentName || '',
      email: report_data?.contactEmail || '',
      contact: report_data?.contactPhone || ''
    },
    theme: {
      color: '#0C2340'
    },
    modal: {
      ondismiss: function() {
        console.log("🔥🔥🔥 RAZORPAY MODAL DISMISSED 🔥🔥🔥");
        if (paymentSucceeded) {
          console.log("🔥 Payment already succeeded, ignoring dismiss");
          return; // Don't show error if payment already succeeded
        }
        console.log("🔥 Payment cancelled by user");
        console.log('[Razorpay] Payment modal dismissed by user');
        onError('Payment cancelled. Please complete the payment to generate your report.');
      },
      confirm_close: true,
      animation: true
    }
  };

  try {
    if (!window.Razorpay) {
      console.error('[Razorpay] Razorpay script not loaded');
      onError('Payment service not available. Please try these steps:\n1. Refresh the page\n2. Disable AdBlocker/Brave Shields\n3. Try Chrome Incognito mode');
      return;
    }

    console.log("🔥 Creating new Razorpay instance with options");
    const rzp = new window.Razorpay(options);
    rzpInstance = rzp; // Store instance for programmatic close
    console.log("🔥 Razorpay instance created successfully");
    
    rzp.on('payment.failed', function (response: any) {
      console.error("🔥🔥🔥 RAZORPAY PAYMENT FAILED 🔥🔥🔥");
      console.error("🔥 Error:", response.error);
      onError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
    });

    console.log("🔥 Calling rzp.open() to show payment modal");
    rzp.open();
    console.log("🔥 rzp.open() called - modal should be visible");
  } catch (error) {
    console.error("🔥🔥🔥 FAILED TO INITIALIZE RAZORPAY 🔥🔥🔥");
    console.error("🔥 Error:", error);
    onError('Failed to initialize payment. Please:\n1. Disable AdBlocker/Brave Shields\n2. Try Chrome Incognito mode\n3. Refresh the page and try again');
  }
}

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      console.log('[Razorpay] Script already loaded');
      resolve();
      return;
    }

    console.log('[Razorpay] Loading script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('[Razorpay] Script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('[Razorpay] Failed to load script');
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
}