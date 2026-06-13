import { motion } from 'motion/react';
import { Activity, ArrowLeft, FileText } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export default function TermsPage({ onBack }: TermsPageProps) {
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
              <p className="text-[7px] sm:text-[8px] font-mono uppercase tracking-widest opacity-60 truncate">Terms & Conditions</p>
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
              <FileText className="w-8 h-8" />
              <div>
                <h1 className="text-4xl font-bold">Terms & Conditions</h1>
                <p className="text-sm text-gray-600 mt-1">Last updated: June 12, 2026</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using GraphiaCheck ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms & Conditions, please do not use the Service.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  GraphiaCheck is operated by GraphiaCheck Technologies ("we", "us", or "our"). The Service provides AI-powered handwriting analysis for educational and clinical assessment purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  GraphiaCheck is a clinical diagnostic tool that analyzes handwriting samples to screen for characteristics associated with dysgraphia and dyslexia. The Service generates comprehensive reports based on AI analysis of uploaded handwriting samples.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 my-4">
                  <p className="text-sm font-semibold text-yellow-900">
                    <strong>Important:</strong> GraphiaCheck is a screening tool and should not replace professional medical or psychological diagnosis. All reports should be reviewed by qualified educational or medical professionals.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. User Eligibility & Account Registration</h2>
                <h3 className="text-lg font-semibold mb-2">3.1 Eligibility</h3>
                <p className="text-gray-700 leading-relaxed">
                  You must be at least 18 years old to use this Service. If you are using the Service on behalf of a minor, you represent that you are the parent or legal guardian with authority to consent to the use of the Service.
                </p>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">3.2 Account Security</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You may not share your account with others or allow others to access your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Payment & Subscription</h2>
                <h3 className="text-lg font-semibold mb-2">4.1 Pricing</h3>
                <p className="text-gray-700 leading-relaxed">
                  GraphiaCheck offers various subscription plans and pay-per-use options. All prices are listed in Indian Rupees (INR) unless otherwise specified. Prices are subject to change with 30 days notice.
                </p>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">4.2 Payment Processing</h3>
                <p className="text-gray-700 leading-relaxed">
                  All payments are processed securely through Razorpay. We do not store your complete credit card information. By providing payment information, you authorize us to charge the applicable fees to your payment method.
                </p>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">4.3 Auto-Renewal</h3>
                <p className="text-gray-700 leading-relaxed">
                  Subscription plans automatically renew at the end of each billing period unless cancelled. You will be charged the then-current subscription rate. You can cancel auto-renewal at any time from your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Refund & Cancellation Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Please refer to our separate <button onClick={() => window.location.hash = '#refund'} className="text-blue-600 underline">Refund & Cancellation Policy</button> for detailed information regarding refunds, cancellations, and billing disputes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Acceptable Use</h2>
                <h3 className="text-lg font-semibold mb-2">6.1 You agree NOT to:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                  <li>Upload or transmit viruses, malware, or any malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems or networks</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>Use automated systems (bots, scrapers) to access the Service</li>
                  <li>Resell, redistribute, or sublicense the Service without written permission</li>
                  <li>Upload content that infringes on intellectual property rights of others</li>
                  <li>Use the Service to generate false or misleading reports</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
                <h3 className="text-lg font-semibold mb-2">7.1 Our Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Service, including all software, algorithms, reports, designs, text, graphics, and other content, is owned by GraphiaCheck and protected by copyright, trademark, and other intellectual property laws.
                </p>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">7.2 Your Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of all handwriting samples and personal information you upload. By uploading content, you grant us a limited license to process, analyze, and generate reports based on that content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Data Privacy & Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We take data privacy seriously. All student data is encrypted and handled in compliance with applicable data protection laws. Please review our <button onClick={() => window.location.hash = '#privacy'} className="text-blue-600 underline">Privacy Policy</button> for detailed information on how we collect, use, and protect your data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Disclaimers & Limitations</h2>
                <div className="bg-red-50 border-l-4 border-red-600 p-4 my-4">
                  <h3 className="font-bold text-red-900 mb-2">Medical Disclaimer</h3>
                  <p className="text-sm text-red-800 leading-relaxed">
                    GraphiaCheck is a SCREENING TOOL ONLY and does not provide medical or psychological diagnosis. Reports generated by our AI should be reviewed and interpreted by qualified professionals (special educators, educational psychologists, occupational therapists, or physicians).
                  </p>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">9.1 "As-Is" Service</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the Service will be error-free, uninterrupted, or meet your specific requirements.
                </p>
                
                <h3 className="text-lg font-semibold mb-2 mt-4">9.2 Limitation of Liability</h3>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, GraphiaCheck shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any other reason at our sole discretion. Upon termination, you will lose access to your account and all associated data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Modifications to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. Governing Law & Dispute Resolution</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in [City], India.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
                <div className="bg-gray-50 border border-gray-300 p-6 rounded">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>GraphiaCheck Technologies</strong><br />
                    Email: <a href="mailto:legal@graphiacheck.in" className="text-blue-600 underline">legal@graphiacheck.in</a><br />
                    Support: <a href="mailto:support@graphiacheck.in" className="text-blue-600 underline">support@graphiacheck.in</a><br />
                    Website: <a href="https://graphiacheck.in" className="text-blue-600 underline">https://graphiacheck.in</a>
                  </p>
                </div>
              </section>

              <section className="border-t-2 border-gray-300 pt-6 mt-8">
                <p className="text-sm text-gray-600 italic">
                  By clicking "I Accept" during registration or by using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-[#141414] text-[#E4E3E0] border-t-4 border-[#E4E3E0] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm opacity-60 font-mono">
              © 2026 GraphiaCheck. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
