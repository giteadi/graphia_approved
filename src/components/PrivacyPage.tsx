import { motion } from 'motion/react';
import { Activity, ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';
import Footer from "./Footer";

interface PrivacyPageProps {
  onBack: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function PrivacyPage({ onBack, onTerms, onPrivacy, onRefund }: PrivacyPageProps) {
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
              <p className="text-[7px] sm:text-[8px] font-mono uppercase tracking-widest opacity-60 truncate">Privacy Policy</p>
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
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-4xl font-bold">Privacy Policy</h1>
                <p className="text-sm text-gray-600 mt-1">Last updated: June 12, 2026</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  GraphiaCheck Technologies ("we", "us", or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our GraphiaCheck service.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    <strong>Your Privacy Matters:</strong> We understand that student data is sensitive and confidential. We are committed to FERPA, COPPA, and GDPR compliance where applicable.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  2. Information We Collect
                </h2>
                
                <h3 className="text-lg font-semibold mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, phone number, professional credentials</li>
                  <li><strong>Student Information:</strong> Student name, date of birth, grade level, school name</li>
                  <li><strong>Handwriting Samples:</strong> Uploaded images of handwriting for analysis</li>
                  <li><strong>Assessment Data:</strong> Observations, data sources, clinical notes, intervention history</li>
                  <li><strong>Payment Information:</strong> Processed securely through Razorpay (we do not store complete card details)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, analysis history</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers</li>
                  <li><strong>Cookies & Tracking:</strong> We use cookies to maintain sessions and improve user experience</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Service Delivery:</strong> To process handwriting samples and generate clinical reports</li>
                  <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
                  <li><strong>Improvement:</strong> To analyze usage patterns and improve our AI models and service quality</li>
                  <li><strong>Communication:</strong> To send service updates, report notifications, and important announcements</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                  <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  4. Data Security & Protection
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">We implement industry-standard security measures to protect your data:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
                  <li><strong>Access Controls:</strong> Strict role-based access controls limit who can view student data</li>
                  <li><strong>Secure Infrastructure:</strong> Hosted on secure, compliant cloud infrastructure</li>
                  <li><strong>Regular Audits:</strong> Periodic security audits and vulnerability assessments</li>
                  <li><strong>Data Backup:</strong> Regular encrypted backups to prevent data loss</li>
                  <li><strong>Employee Training:</strong> All staff undergo data privacy and security training</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Data Sharing & Disclosure</h2>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 my-4">
                  <p className="text-sm font-semibold text-green-900">
                    <strong>We DO NOT sell, rent, or trade your personal information to third parties.</strong>
                  </p>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">We may share information only in these cases:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Service Providers:</strong> Third-party services (hosting, payment processing, email) bound by confidentiality agreements</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets (with user notification)</li>
                  <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <UserCheck className="w-6 h-6" />
                  6. Your Rights & Choices
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">You have the following rights regarding your personal data:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                  <li><strong>Export:</strong> Download your data in a portable format (JSON, CSV)</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (service emails are mandatory)</li>
                  <li><strong>Restrict Processing:</strong> Request limitation on how we process your data</li>
                </ul>
                
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise any of these rights, email us at <a href="mailto:privacy@graphiacheck.in" className="text-blue-600 underline">privacy@graphiacheck.in</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Children's Privacy (COPPA Compliance)</h2>
                <p className="text-gray-700 leading-relaxed">
                  GraphiaCheck is designed for use by educators, therapists, and parents—not directly by children under 13. We do not knowingly collect personal information directly from children. If you are a parent/guardian and believe we have collected information about your child, contact us immediately for deletion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide services. You can delete your account and all associated data at any time from your account settings. After deletion:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                  <li>All handwriting samples are permanently deleted within 30 days</li>
                  <li>Personal information is anonymized or deleted within 90 days</li>
                  <li>Backup copies are purged within 180 days</li>
                  <li>Some data may be retained longer if required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your data may be stored and processed in servers located in India or other countries. We ensure that any international transfers comply with applicable data protection laws and are protected by appropriate safeguards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed mb-3">We use the following third-party services:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Razorpay:</strong> Payment processing (see their <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Privacy Policy</a>)</li>
                  <li><strong>OpenAI/Gemini:</strong> AI model providers for handwriting analysis</li>
                  <li><strong>Cloud Hosting:</strong> Secure cloud infrastructure providers</li>
                  <li><strong>Analytics:</strong> Usage analytics to improve service quality (anonymized data only)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Cookies & Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. You can control cookies through your browser settings, but disabling them may affect service functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. Changes to Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy periodically. Material changes will be notified via email or prominent notice on our website. Your continued use after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
                <div className="bg-gray-50 border border-gray-300 p-6 rounded">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Data Protection Officer</strong><br />
                    GraphiaCheck Technologies<br />
                    Email: <a href="mailto:privacy@graphiacheck.in" className="text-blue-600 underline">privacy@graphiacheck.in</a><br />
                    Support: <a href="mailto:support@graphiacheck.in" className="text-blue-600 underline">support@graphiacheck.in</a><br />
                    Website: <a href="https://graphiacheck.in" className="text-blue-600 underline">https://graphiacheck.in</a>
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    For privacy-related inquiries, please allow up to 30 days for a response.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer
        onTerms={onTerms}
        onPrivacy={onPrivacy}
        onRefund={onRefund}
      />
    </div>
  );
}
