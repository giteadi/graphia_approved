import { motion } from 'motion/react';
import { 
  Activity, 
  Brain, 
  Heart, 
  Target, 
  Users,
  Award,
  Zap,
  Shield,
  BookOpen,
  TrendingUp,
  ArrowLeft,
  Mail,
  Globe
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function AboutPage({ onBack, onTerms, onPrivacy, onRefund }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414]">
      {/* Header/Navbar */}
      <header className="border-b-2 border-[#141414] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#E4E3E0]" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">GraphiaCheck</h1>
              <p className="text-[8px] font-mono uppercase tracking-widest opacity-60">Clinical Handwriting Analysis</p>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="border-2 border-[#141414] px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="inline-block bg-blue-100 border border-blue-600 px-4 py-1 mb-6">
            <span className="text-blue-600 font-mono text-xs uppercase tracking-widest">
              About GraphiaCheck
            </span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Empowering Educators with AI-Driven Clinical Assessment
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            GraphiaCheck is a cutting-edge AI-powered platform designed to help educators, therapists, 
            and specialists quickly and accurately screen for dysgraphia and dyslexia through handwriting analysis.
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="border-2 border-[#141414] p-8 bg-white"
          >
            <Target className="w-12 h-12 mb-4 text-blue-600" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To make professional-grade dysgraphia and dyslexia screening accessible to every educator, 
              therapist, and specialist worldwide. We believe early identification and intervention can 
              transform a student's educational journey.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="border-2 border-[#141414] p-8 bg-white"
          >
            <Heart className="w-12 h-12 mb-4 text-red-600" />
            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              A world where every student with learning differences is identified early, supported 
              comprehensively, and empowered to reach their full potential through evidence-based 
              interventions and assistive technologies.
            </p>
          </motion.div>
        </div>

        {/* The Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white border-2 border-[#141414] p-12 mb-20"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
              <p>
                GraphiaCheck was born from a simple observation: while learning specialists and educational 
                psychologists have deep expertise in identifying dysgraphia and dyslexia, the traditional 
                assessment process is time-consuming, expensive, and often inaccessible to families who need it most.
              </p>
              <p>
                Our founding team—comprising special educators, machine learning engineers, and clinical 
                psychologists—spent years studying handwriting patterns, spelling error profiles, and motor 
                coordination indicators across thousands of student samples from Grade 1 through college.
              </p>
              <p>
                The result is GraphiaCheck: an AI engine that can analyze handwriting with clinical accuracy, 
                generate comprehensive diagnostic reports in minutes, and provide actionable intervention 
                strategies—all while remaining accessible to educators and specialists worldwide.
              </p>
              <p className="font-semibold text-[#141414] pt-4">
                Today, GraphiaCheck is trusted by educators, occupational therapists, and learning specialists 
                across multiple countries to help identify students who may benefit from targeted support and intervention.
              </p>
            </div>
          </div>
        </motion.div>

        {/* What Makes Us Different */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">What Makes Us Different</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-[#141414] p-6 bg-white">
              <Brain className="w-10 h-10 mb-4 text-purple-600" />
              <h3 className="text-xl font-bold mb-3">Clinical-Grade AI</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our AI models are trained on real clinical data and validated against established 
                diagnostic criteria. Not just pattern recognition—true clinical assessment.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <BookOpen className="w-10 h-10 mb-4 text-green-600" />
              <h3 className="text-xl font-bold mb-3">Comprehensive Reports</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                4-page clinical reports with visual analytics, spelling error analysis, benchmark 
                comparisons, and specific intervention recommendations for parents and educators.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <Zap className="w-10 h-10 mb-4 text-yellow-600" />
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                What used to take hours of manual analysis now takes less than 2 minutes. 
                Spend less time on assessment, more time on intervention.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <Shield className="w-10 h-10 mb-4 text-blue-600" />
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Student data is encrypted, never shared with third parties, and can be permanently 
                deleted at any time. FERPA and COPPA compliant.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <Users className="w-10 h-10 mb-4 text-indigo-600" />
              <h3 className="text-xl font-bold mb-3">Multi-Stakeholder</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Reports designed for teachers, parents, OTs, educational psychologists, and 
                pediatricians—clear, actionable, and jargon-free.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <TrendingUp className="w-10 h-10 mb-4 text-red-600" />
              <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Save reports, track interventions, and monitor improvement over time. 
                Data-driven decision making for better student outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-[#141414] text-[#E4E3E0] border-4 border-[#141414] p-12 mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">Our Core Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E4E3E0] text-[#141414] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-wider">Excellence</h3>
              <p className="text-sm opacity-80">
                Clinical accuracy and research-backed methodology in everything we build.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#E4E3E0] text-[#141414] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-wider">Compassion</h3>
              <p className="text-sm opacity-80">
                Every student deserves support, understanding, and the tools to succeed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#E4E3E0] text-[#141414] rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-wider">Accessibility</h3>
              <p className="text-sm opacity-80">
                Professional-grade assessment should be available to everyone, everywhere.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#E4E3E0] text-[#141414] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2 uppercase tracking-wider">Integrity</h3>
              <p className="text-sm opacity-80">
                Transparent methodology, ethical AI, and unwavering commitment to privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6">Built by Experts</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Our multidisciplinary team combines expertise in special education, clinical psychology, 
            machine learning, and user experience design to create the most comprehensive handwriting 
            assessment platform available.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="border-2 border-[#141414] p-6 bg-white">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Special Educators</h3>
              <p className="text-sm text-gray-600">
                M.Ed., Learning Disabilities specialists with 10+ years clinical experience
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI Engineers</h3>
              <p className="text-sm text-gray-600">
                Ph.D. researchers in computer vision, NLP, and clinical machine learning
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 bg-white">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Clinical Psychologists</h3>
              <p className="text-sm text-gray-600">
                Licensed psychologists specializing in educational assessment and intervention
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white border-4 border-[#141414] p-12 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join educators and specialists worldwide who trust GraphiaCheck for clinical-grade 
            handwriting assessment. Start your first analysis today—completely free.
          </p>
          <button 
            onClick={onBack}
            className="bg-[#141414] text-[#E4E3E0] px-10 py-5 font-bold text-lg uppercase tracking-widest hover:bg-[#2a2a2a] transition-all inline-flex items-center gap-3"
          >
            Start Free Analysis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141414] text-[#E4E3E0] border-t-4 border-[#E4E3E0]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#E4E3E0] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#141414]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">GraphiaCheck</h3>
                  <p className="text-xs font-mono uppercase tracking-wider opacity-60">Clinical Analysis</p>
                </div>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                AI-powered handwriting analysis for clinical-grade dysgraphia and dyslexia screening.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button onClick={onBack} className="hover:opacity-100 transition-opacity">Start Analysis</button></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Features</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Pricing</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Documentation</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Help Center</a></li>
                <li><a href="mailto:support@graphiacheck.in" className="hover:opacity-100 transition-opacity">Contact Us</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button onClick={onPrivacy} className="hover:opacity-100 transition-opacity text-left">Privacy Policy</button></li>
                <li><button onClick={onTerms} className="hover:opacity-100 transition-opacity text-left">Terms of Service</button></li>
                <li><button onClick={onRefund} className="hover:opacity-100 transition-opacity text-left">Refund Policy</button></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Data Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E4E3E0]/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-60 font-mono">
              © 2026 GraphiaCheck. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="mailto:support@graphiacheck.in" className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
                <Mail className="w-4 h-4" /> support@graphiacheck.in
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
