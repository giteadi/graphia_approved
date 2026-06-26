import { motion } from 'motion/react';
import { Activity, ArrowLeft, DollarSign, RefreshCw, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Footer from "./Footer";

interface RefundPageProps {
  onBack: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function RefundPage({ onBack, onTerms, onPrivacy, onRefund }: RefundPageProps) {
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414]">
      {/* Header */}
      <header className="border-b-2 border-[#141414] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#141414] flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#E4E3E0]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-xl tracking-tight truncate">GraphiaCheck</h1>
              <p className="text-[7px] sm:text-[8px] font-mono uppercase tracking-widest opacity-60 truncate">Refund & Cancellation Policy</p>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="border-2 border-[#141414] px-3 py-1.5 sm:px-6 sm:py-2 font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white border-2 border-[#141414] p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-8">
              <RefreshCw className="w-8 h-8" />
              <div>
                <h1 className="text-4xl font-bold">Refund & Cancellation Policy</h1>
                <p className="text-sm text-gray-600 mt-1">Last updated: June 12, 2026</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
                <p className="text-gray-700 leading-relaxed">
                  At GraphiaCheck, we strive to provide exceptional service. This policy outlines our refund and cancellation terms for both subscription plans and pay-per-use services. All payments are processed securely through Razorpay.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  1.1 Razorpay Payment Processing
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  GraphiaCheck uses Razorpay as its primary payment gateway for all transactions. Below is our Razorpay-specific refund policy:
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
                  <p className="flex items-start gap-2 text-sm text-blue-900">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span><strong>Razorpay Refund Policy:</strong> All refunds are processed through Razorpay's secure payment gateway. Refund timelines depend on your payment method and bank processing times.</span>
                  </p>
                </div>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.1.1 Razorpay Refund Eligibility</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Successful Transactions:</strong> Refunds only for eligible cases as outlined in Sections 2 & 3</li>
                  <li><strong>Failed Transactions:</strong> Amount automatically refunded by Razorpay within 5-7 business days</li>
                  <li><strong>Pending Transactions:</strong> If payment is pending, no refund needed - transaction will expire</li>
                  <li><strong>Duplicate Charges:</strong> Razorpay automatically flags duplicates for refund</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.1.2 Razorpay Refund Process</h3>
                <div className="bg-gray-50 border border-gray-300 p-6 rounded space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold mb-1">Refund Initiation</h4>
                      <p className="text-sm text-gray-700">GraphiaCheck initiates refund request through Razorpay dashboard upon approval</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold mb-1">Razorpay Processing</h4>
                      <p className="text-sm text-gray-700">Razorpay processes refund and sends confirmation to your email</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold mb-1">Bank Settlement</h4>
                      <p className="text-sm text-gray-700">Your bank processes the refund to your original payment method</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <h4 className="font-semibold mb-1">Credit to Account</h4>
                      <p className="text-sm text-gray-700">Refund amount credited to your account (timeline varies by payment method)</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.1.3 Razorpay Payment Method Refund Timelines</h3>
                <table className="w-full border border-gray-300 text-sm mt-3">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Payment Method</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Razorpay Processing</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Bank Settlement</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Total Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Credit Card (Visa/Mastercard)</td>
                      <td className="border border-gray-300 p-3">1-2 business days</td>
                      <td className="border border-gray-300 p-3">5-7 business days</td>
                      <td className="border border-gray-300 p-3">6-9 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Debit Card</td>
                      <td className="border border-gray-300 p-3">1-2 business days</td>
                      <td className="border border-gray-300 p-3">5-10 business days</td>
                      <td className="border border-gray-300 p-3">6-12 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Net Banking</td>
                      <td className="border border-gray-300 p-3">2-3 business days</td>
                      <td className="border border-gray-300 p-3">5-7 business days</td>
                      <td className="border border-gray-300 p-3">7-10 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">UPI</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                      <td className="border border-gray-300 p-3">1-3 business days</td>
                      <td className="border border-gray-300 p-3">1-4 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Paytm Wallet</td>
                      <td className="border border-gray-300 p-3">Instant</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">PhonePe Wallet</td>
                      <td className="border border-gray-300 p-3">Instant</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Amazon Pay</td>
                      <td className="border border-gray-300 p-3">Instant-24 hours</td>
                      <td className="border border-gray-300 p-3">1-2 business days</td>
                      <td className="border border-gray-300 p-3">1-3 business days</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.1.4 Razorpay Transaction ID Tracking</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Every payment through Razorpay generates a unique Transaction ID. For refund requests, you must provide:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Razorpay Payment ID:</strong> Found in your payment confirmation email</li>
                  <li><strong>Order ID:</strong> Internal GraphiaCheck order reference</li>
                  <li><strong>Amount:</strong> Exact amount charged</li>
                  <li><strong>Date:</strong> Date of transaction</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 my-4">
                  <p className="flex items-start gap-2 text-sm text-yellow-900">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span><strong>Note:</strong> Without the Razorpay Payment ID, refund processing may be delayed. Always save your payment confirmation email.</span>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  2. Subscription Plans
                </h2>
                
                <h3 className="text-lg font-semibold mb-2">2.1 Cancellation Policy</h3>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 my-4">
                  <p className="flex items-start gap-2 text-sm text-green-900">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>You can cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period.</span>
                  </p>
                </div>

                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Immediate Cancellation:</strong> No charges for future billing periods</li>
                  <li><strong>Access Until End:</strong> You retain access to premium features until the end of your paid period</li>
                  <li><strong>No Partial Refunds:</strong> Cancelling mid-cycle does not result in a prorated refund</li>
                  <li><strong>Re-subscription:</strong> You can re-subscribe at any time at the current pricing</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Refund Policy for Subscriptions</h3>
                <p className="text-gray-700 leading-relaxed mb-3">Subscription refunds are available ONLY in the following cases:</p>
                
                <div className="space-y-3">
                  <div className="border border-green-300 bg-green-50 p-4 rounded">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Full Refund Eligible (Within 7 Days)
                    </h4>
                    <ul className="list-disc pl-6 text-sm text-green-800 space-y-1">
                      <li>Technical issues prevented service access</li>
                      <li>Service was not delivered as described</li>
                      <li>Duplicate or erroneous charge</li>
                      <li>No reports were generated during the billing period</li>
                    </ul>
                    <p className="text-xs text-green-700 mt-2">
                      <strong>Timeline:</strong> Request within 7 days of charge. Refund processed within 5-7 business days.
                    </p>
                  </div>

                  <div className="border border-red-300 bg-red-50 p-4 rounded">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      No Refund - Non-Eligible Cases
                    </h4>
                    <ul className="list-disc pl-6 text-sm text-red-800 space-y-1">
                      <li>Change of mind after using the service</li>
                      <li>Reports were already generated and downloaded</li>
                      <li>Subscription renewal (should have cancelled before renewal)</li>
                      <li>Request made after 7-day window</li>
                      <li>Account suspended due to Terms violation</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  3. Pay-Per-Use / Single Report Purchase
                </h2>
                
                <h3 className="text-lg font-semibold mb-2">3.1 Refund Eligibility</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 my-4">
                  <p className="flex items-start gap-2 text-sm text-yellow-900">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span><strong>Important:</strong> Once a report is successfully generated and viewable, NO refunds will be issued. Purchases are final.</span>
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed mb-3">Refunds for pay-per-use are ONLY available if:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Payment was deducted but report generation failed due to system error</li>
                  <li>Duplicate charge occurred</li>
                  <li>Payment was unauthorized or fraudulent</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">3.2 Timeline for Refund Requests</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Immediate Issues:</strong> Report refund request within 24 hours of purchase</li>
                  <li><strong>Processing Time:</strong> Refunds processed within 5-7 business days</li>
                  <li><strong>Method:</strong> Refunded to original payment method via Razorpay</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. How to Request a Refund</h2>
                <p className="text-gray-700 leading-relaxed mb-4">To request a refund, follow these steps:</p>
                
                <div className="bg-gray-50 border border-gray-300 p-6 rounded space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold mb-1">Email Our Support Team</h4>
                      <p className="text-sm text-gray-700">Send an email to <a href="mailto:refunds@graphiacheck.in" className="text-blue-600 underline">refunds@graphiacheck.in</a></p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold mb-1">Provide Required Information</h4>
                      <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                        <li>Your registered email address</li>
                        <li>Transaction ID / Payment Receipt</li>
                        <li>Date of purchase</li>
                        <li>Reason for refund request</li>
                        <li>Screenshots (if technical issue occurred)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold mb-1">Wait for Review</h4>
                      <p className="text-sm text-gray-700">Our team will review your request within 48-72 hours and respond via email</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <h4 className="font-semibold mb-1">Refund Processing</h4>
                      <p className="text-sm text-gray-700">If approved, refund will be processed within 5-7 business days to your original payment method</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Failed Transactions</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  If payment was deducted from your account but the transaction shows as "Failed" in our system:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>The amount will be automatically refunded by your bank within 5-7 business days</li>
                  <li>If not refunded within 7 days, contact us at <a href="mailto:support@graphiacheck.in" className="text-blue-600 underline">support@graphiacheck.in</a> with transaction details</li>
                  <li>We will coordinate with Razorpay to expedite the refund</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Chargebacks & Disputes</h2>
                <div className="bg-red-50 border-l-4 border-red-600 p-4 my-4">
                  <p className="text-sm text-red-900 leading-relaxed">
                    <strong>Important:</strong> If you initiate a chargeback through your bank instead of contacting us first, your account will be immediately suspended pending investigation. Chargebacks incur processing fees and may result in permanent account closure.
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Please contact our support team first to resolve any payment issues. We are committed to fair and prompt resolution of all billing concerns.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Auto-Renewal & Billing</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Reminder Emails:</strong> We send renewal reminders 7 days before your subscription renews</li>
                  <li><strong>Cancel Anytime:</strong> Cancel auto-renewal from Account Settings before renewal date to avoid charges</li>
                  <li><strong>Price Changes:</strong> You will be notified 30 days before any price increase</li>
                  <li><strong>Failed Payments:</strong> If payment fails, we will retry 3 times over 7 days before suspending access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Refund Timeline & Method</h2>
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Payment Method</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">Refund Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Credit/Debit Card</td>
                      <td className="border border-gray-300 p-3">5-7 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Net Banking</td>
                      <td className="border border-gray-300 p-3">5-7 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">UPI</td>
                      <td className="border border-gray-300 p-3">3-5 business days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Wallets (Paytm, PhonePe, etc.)</td>
                      <td className="border border-gray-300 p-3">24-48 hours</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm text-gray-600 italic mt-3">
                  Note: Refund timelines depend on your bank/payment provider. GraphiaCheck initiates refunds immediately upon approval.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Special Circumstances</h2>
                <h3 className="text-lg font-semibold mb-2">9.1 Technical Issues</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you experience persistent technical issues preventing service use, contact support immediately. We will either resolve the issue promptly or issue a full refund.
                </p>

                <h3 className="text-lg font-semibold mb-2 mt-4">9.2 Billing Errors</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you believe you were incorrectly charged, contact us within 30 days with transaction details. We will investigate and refund if an error occurred.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Contact for Refunds & Billing</h2>
                <div className="bg-gray-50 border border-gray-300 p-6 rounded">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Refunds & Billing Department</strong><br />
                    GraphiaCheck Technologies<br />
                    Email: <a href="mailto:refunds@graphiacheck.in" className="text-blue-600 underline">refunds@graphiacheck.in</a><br />
                    Support: <a href="mailto:support@graphiacheck.in" className="text-blue-600 underline">support@graphiacheck.in</a><br />
                    Website: <a href="https://graphiacheck.in" className="text-blue-600 underline">https://graphiacheck.in</a>
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    <strong>Response Time:</strong> All refund requests are reviewed within 48-72 hours (business days).
                  </p>
                </div>
              </section>

              <section className="border-t-2 border-gray-300 pt-6 mt-8">
                <p className="text-sm text-gray-600 italic">
                  This Refund & Cancellation Policy is part of our Terms & Conditions. By using GraphiaCheck, you agree to this policy. We reserve the right to modify this policy with 30 days notice.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    
    </div>
  );
}
