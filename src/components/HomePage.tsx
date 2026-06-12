import { motion } from 'motion/react';
import { 
  Activity, 
  Brain, 
  FileText, 
  Zap, 
  Target, 
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onAbout: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function HomePage({ onGetStarted, onAbout, onTerms, onPrivacy, onRefund }: HomePageProps) {
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
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={onAbout}
              className="font-mono text-sm uppercase tracking-wider hover:text-blue-600 transition-colors"
            >
              About
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-[#141414] text-[#E4E3E0] px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#2a2a2a] transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-blue-100 border border-blue-600 px-4 py-1 mb-6">
              <span className="text-blue-600 font-mono text-xs uppercase tracking-widest">
                AI-Powered Clinical Assessment
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Professional Dysgraphia Screening in Minutes
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              GraphiaCheck uses advanced AI to analyze handwriting samples and generate comprehensive clinical reports for dysgraphia and dyslexia screening. Trusted by educators and specialists worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-[#141414] text-[#E4E3E0] px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-2"
              >
                Start  Analysis <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onAbout}
                className="border-2 border-[#141414] px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
              >
                Learn More
              </button>
            </div>
            
           
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="border-4 border-[#141414] bg-white p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                  <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold">Upload Sample</div>
                    <div className="text-xs text-gray-500 font-mono">75-100 words minimum</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                  <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold">AI Analysis</div>
                    <div className="text-xs text-gray-500 font-mono">Advanced pattern recognition</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold">Clinical Report</div>
                    <div className="text-xs text-gray-500 font-mono">PDF, DOCX, Markdown export</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y-2 border-[#141414] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose GraphiaCheck?</h2>
            <p className="text-xl text-gray-600 font-mono uppercase tracking-wider">
              Comprehensive. Accurate. Clinical-Grade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <Zap className="w-12 h-12 mb-4 text-yellow-600" />
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Generate comprehensive clinical reports in under 2 minutes with our advanced AI engine.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <Target className="w-12 h-12 mb-4 text-red-600" />
              <h3 className="text-xl font-bold mb-3">Precise Analysis</h3>
              <p className="text-gray-600">
                Evaluates 7+ key metrics including alignment, spacing, formation, speed, and spelling patterns.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <Shield className="w-12 h-12 mb-4 text-green-600" />
              <h3 className="text-xl font-bold mb-3">Clinical Grade</h3>
              <p className="text-gray-600">
                Calibrated for Grades 1-15 with benchmark comparisons and actionable intervention strategies.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <BookOpen className="w-12 h-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-bold mb-3">Detailed Reports</h3>
              <p className="text-gray-600">
                4-page comprehensive reports with visual charts, spelling analysis, and professional recommendations.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <Users className="w-12 h-12 mb-4 text-purple-600" />
              <h3 className="text-xl font-bold mb-3">Multi-Stakeholder</h3>
              <p className="text-gray-600">
                Reports designed for educators, parents, therapists, and educational psychologists.
              </p>
            </div>

            <div className="border-2 border-[#141414] p-6 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
              <TrendingUp className="w-12 h-12 mb-4 text-indigo-600" />
              <h3 className="text-xl font-bold mb-3">Track Progress</h3>
              <p className="text-gray-600">
                Save reports and monitor improvement over time with intervention history tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to comprehensive assessment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Upload or Capture</h3>
              <p className="text-gray-600">
                Upload a handwriting sample (75-100 words) or use your webcam to capture work in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Enter Details</h3>
              <p className="text-gray-600">
                Provide student grade, timing information, and select any observed characteristics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Get Clinical Report</h3>
              <p className="text-gray-600">
                Receive a comprehensive 4-page report with scores, charts, and actionable recommendations.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={onGetStarted}
              className="bg-[#141414] text-[#E4E3E0] px-10 py-5 font-bold text-lg uppercase tracking-widest hover:bg-[#2a2a2a] transition-all inline-flex items-center gap-3"
            >
              Try It Now - @799 Only <ArrowRight className="w-6 h-6" />
            </button>
          </div>
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
                <li><button onClick={onGetStarted} className="hover:opacity-100 transition-opacity">Start Analysis</button></li>
                <li><button onClick={onAbout} className="hover:opacity-100 transition-opacity">About Us</button></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Features</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Documentation</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Help Center</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Contact Us</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button onClick={onPrivacy} className="hover:opacity-100 transition-opacity text-left w-full">Privacy Policy</button></li>
                <li><button onClick={onTerms} className="hover:opacity-100 transition-opacity text-left w-full">Terms of Service</button></li>
                <li><button onClick={onRefund} className="hover:opacity-100 transition-opacity text-left w-full">Refund Policy</button></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Data Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E4E3E0]/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-60 font-mono">
              © 2026 GraphiaCheck. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity font-mono">
                Privacy
              </a>
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity font-mono">
                Terms
              </a>
              <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity font-mono">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
