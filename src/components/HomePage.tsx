import React, { useState } from 'react';
import { 
  ArrowRight, 
  Brain, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  PenTool, 
  Eye, 
  Layers,
  ChevronRight,
  TrendingDown,
  Compass,
  Check
} from 'lucide-react';
import Navbar from "./Navbar";
import Footer from "./Footer";

interface HomePageProps {
  onGetStarted: () => void;
  onHome: () => void;
  onAbout: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function HomePage({ onGetStarted, onHome, onAbout, onTerms, onPrivacy, onRefund }: HomePageProps) {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'vision' | 'rti' | 'transcription' | 'report'>('vision');

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#141E28] font-sans selection:bg-[#0D6E6E] selection:text-white">

      {/* ── NAVBAR ── */}
      <Navbar
        showBack={false}
        onGetStarted={onGetStarted}
        onHome={onHome}
        onAbout={onAbout}
        onLogin={onGetStarted}
        activePage="home"
      />

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-[#E2DDCF]/80">
        {/* Subtle background graph paper watermark grid */}
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#141E28 1px, transparent 1px), radial-gradient(#141E28 1px, #F7F5F0 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Clinical Eyebrow Pill */}
              <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-[#D5CEBE] rounded-full px-4 py-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#0D6E6E] animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-[#4A5568] font-semibold font-mono">
                  Clinical Decision Support · Grades 1 – 15 (College)
                </span>
              </div>

              {/* Main Headline */}
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F2231] leading-[1.12]"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Precision Dysgraphia Screening Powered by{' '}
                <span className="text-[#0D6E6E] italic font-normal">Computer Vision.</span>
              </h1>

              {/* Lead Subtitle */}
              <p className="text-base sm:text-lg text-[#556270] leading-relaxed max-w-xl">
                An evidence-based screening platform that objectively models stroke geometry, baseline deviation, and cognitive fluency to assist clinicians, psychologists, and educators in detecting written expression disorders.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3.5 sm:items-center">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2.5 bg-[#0D6E6E] hover:bg-[#095252] text-white px-7 py-4 rounded-md font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Launch Screening Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onAbout}
                  className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-[#0F2231] border border-[#CBD5E1] hover:border-[#0F2231] px-6 py-4 rounded-md font-medium text-sm transition-all shadow-xs"
                >
                  <Eye className="w-4 h-4 text-[#0D6E6E]" />
                  <span>Clinical Methodology</span>
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#E2DDCF] max-w-lg">
                <div>
                  <div className="text-2xl font-black text-[#0F2231] font-mono">75–100</div>
                  <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">Min Words</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#0F2231] font-mono">&lt; 60s</div>
                  <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">Analysis Time</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#0D6E6E] font-mono">3 Pages</div>
                  <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">A4 Clinical PDF</div>
                </div>
              </div>

            </div>

            {/* Right Column: High-End Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Glow aura behind card */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#0D6E6E]/20 to-[#D97706]/15 rounded-2xl blur-xl" />

                {/* Primary Visual Showcase Card */}
                <div className="relative bg-white rounded-xl overflow-hidden border border-[#D1D5DB] shadow-2xl">
                  
                  {/* Card Title Bar */}
                  <div className="bg-[#0B1E2D] px-4 py-3 flex items-center justify-between text-white border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-xs font-mono tracking-wider font-semibold uppercase">Computer Vision Engine</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded text-gray-200">
                      Live Sample Scan
                    </span>
                  </div>

                  {/* Generated Clinical Vision Graphic */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#F3F4F6]">
                    <img
                      src="/hero_handwriting_ai.jpg"
                      alt="Computer vision analysis of handwriting strokes and neural metrics"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Subtle Diagnostic Overlays on top of image */}
                    <div className="absolute top-3 left-3 bg-[#0B1E2D]/85 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-sm border border-white/20 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                      Formation Score: 75/100
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-[#0F2231] text-[10px] font-mono px-2.5 py-1 rounded-sm border border-gray-300 shadow-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      Baseline Alignment: 85/100
                    </div>
                  </div>

                  {/* Diagnostic Summary Snapshot Bar */}
                  <div className="p-4 bg-[#FCFBF8] border-t border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Diagnostic Classification:</span>
                      <span className="font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Moderate Probability (RTI Response)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Cognitive Fluency:</span>
                      <span className="font-bold text-[#DC2626] flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        9 WPM (Norm: 20–30)
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Calibrated for Grade 12</span>
                      <span className="text-[#0D6E6E] font-semibold">100% Deterministic</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── NEUROLOGICAL & COGNITIVE FOUNDATION (Leonardo Sketch Art Showcase) ── */}
      <section className="py-20 lg:py-28 bg-[#101D27] text-white relative overflow-hidden">
        {/* Subtle background illumination */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D6E6E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#2DD4BF] font-mono font-semibold">
              The Cognitive Science
            </p>
            <h2 
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              Writing is a complex symphony between the motor cortex and working memory.
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Dysgraphia is not mere poor penmanship. When the physical mechanics of forming letters consume excessive cognitive resources, high-level ideation collapses under cognitive load.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Leonardo Da Vinci Style Sketch Artwork */}
            <div className="lg:col-span-7">
              <div className="rounded-xl overflow-hidden border border-white/15 shadow-2xl relative group bg-black/40">
                <img 
                  src="/sketch_handwriting_neuro.jpg"
                  alt="Leonardo da Vinci style medical sketch illustrating hand neurology and brain cognitive pathways"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-xs text-gray-300 font-mono">
                  <span>Fig 1.1: Neurological Graphology & Motor Cortex Mapping</span>
                  <span className="text-[#38BDF8]">DSM-5 Aligned</span>
                </div>
              </div>
            </div>

            {/* 3 Pillar Clinical Cards */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-white/5 border border-white/10 p-5 rounded-lg backdrop-blur-xs hover:border-[#0D6E6E] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-md bg-[#0D6E6E]/30 text-[#2DD4BF] flex items-center justify-center shrink-0 mt-0.5">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base mb-1">Fine Motor Execution</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Evaluates pen pressure, letter closure geometry, and connector fluency between ascenders and descenders on ruled surfaces.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-lg backdrop-blur-xs hover:border-[#D97706] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-md bg-[#D97706]/30 text-[#FBBF24] flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base mb-1">Orthographic Working Memory</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Distinguishes developmental phonetic spelling lapses from motor omissions, preserving self-corrections and crossed-out words.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-lg backdrop-blur-xs hover:border-[#38BDF8] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-md bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base mb-1">Response to Intervention (RTI)</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Prevents false-positive diagnostic labeling. If a student demonstrates positive growth under structured support, formal labels are deferred.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── INTERACTIVE SCREENING CAPABILITIES (Replaces old broken video section) ── */}
      <section className="py-20 lg:py-28 max-w-6xl mx-auto px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#0D6E6E] font-mono font-semibold">
            Clinical Screening Engine
          </p>
          <h2 
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2231]"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            How GraphiaCheck evaluates writing.
          </h2>
          <p className="text-sm text-gray-600">
            Select a diagnostic domain to explore how computer vision and normative engines process student samples.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: 'vision', label: 'Stroke Geometry & Alignment' },
            { id: 'transcription', label: 'OCR & Error Mapping' },
            { id: 'rti', label: 'RTI Progress & Probability' },
            { id: 'report', label: '3-Page Clinical Report' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFeatureTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activeFeatureTab === tab.id
                  ? 'bg-[#0D6E6E] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display Card */}
        <div className="bg-white rounded-2xl border border-[#D5CEBE] p-8 lg:p-12 shadow-lg">
          
          {activeFeatureTab === 'vision' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase bg-teal-50 text-[#0D6E6E] px-2.5 py-1 rounded font-bold">
                  Motor & Spatial Analysis
                </span>
                <h3 className="text-2xl font-bold text-[#0F2231]" style={{ fontFamily: "'Georgia', serif" }}>
                  Geometric measurement of baseline adherence and letter slant.
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The vision pipeline measures spacing between individual words, ascender-descender line collisions, and baseline drift across ruled paper.
                </p>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D6E6E]" />
                    <span>Calculates <strong>Letter Formation Score</strong> (0–100) based on loop closure</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D6E6E]" />
                    <span>Evaluates <strong>Spatial Alignment Score</strong> against rule lines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D6E6E]" />
                    <span>Detects excessive writing fatigue and tremor pressure variations</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#FAF9F5] p-6 rounded-xl border border-gray-200 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500 uppercase tracking-wider">Metric</span>
                  <span className="text-gray-500 uppercase tracking-wider">Score & Status</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">Letter Formation</span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">75/100 · Adequate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">Spatial Alignment</span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">85/100 · Competent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">Writing Fluency</span>
                  <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">9 WPM · Needs Support</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">Line Quality</span>
                  <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">65/100 · Needs Attention</span>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'transcription' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase bg-amber-50 text-amber-800 px-2.5 py-1 rounded font-bold">
                  Verbatim OCR & Self-Correction
                </span>
                <h3 className="text-2xl font-bold text-[#0F2231]" style={{ fontFamily: "'Georgia', serif" }}>
                  Preserves crossed-out words as active self-monitoring evidence.
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Traditional OCR tools discard struck-through text. GraphiaCheck explicitly catalogs cancellations (`[CANCELLED: word]`), recognizing them as positive self-correction behavior rather than penalizing them as spelling errors.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Spelling Error
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    Grammar Mistake
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded font-mono line-through">
                    Cancelled (Excluded)
                  </span>
                </div>
              </div>
              <div className="bg-[#FAF9F5] p-5 rounded-xl border border-gray-200 text-xs leading-relaxed italic text-gray-800">
                <p className="mb-2 font-mono text-[11px] text-gray-500 uppercase not-italic">Sample OCR Transcript View:</p>
                <p className="bg-white p-4 rounded border border-gray-200 shadow-2xs font-serif leading-6">
                  "Letters would still be the main form of communication and <span className="text-red-600 font-bold underline">tetlephones</span> would still be used <span className="text-red-600 font-bold underline">conmenly</span>. One could argue that life would be simpler because <span className="line-through text-gray-400 font-sans">[there wo]</span> the world would be less <span className="text-red-600 font-bold underline">critisizing</span>..."
                </p>
              </div>
            </div>
          )}

          {activeFeatureTab === 'rti' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase bg-blue-50 text-blue-800 px-2.5 py-1 rounded font-bold">
                  Tiered Intervention Alignment
                </span>
                <h3 className="text-2xl font-bold text-[#0F2231]" style={{ fontFamily: "'Georgia', serif" }}>
                  Clinical probability capped when interventions show progress.
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  In compliance with DSM-5 guidelines, if a student demonstrates positive progress under current classroom accommodations or occupational therapy, probability is appropriately capped at <strong>MODERATE</strong> and formal psycho-educational testing is deferred.
                </p>
                <div className="p-3.5 bg-blue-50/70 border-l-4 border-blue-600 rounded-r text-xs text-blue-900 leading-relaxed">
                  <strong>Clinical Rule:</strong> When Response to Intervention (RTI) is active and positive, students receive actionable strategies without alarming diagnosis labels.
                </div>
              </div>
              <div className="bg-[#FAF9F5] p-6 rounded-xl border border-gray-200 space-y-3 text-xs">
                <div className="border border-red-200 bg-red-50/20 p-3 rounded">
                  <div className="font-bold text-[#991B1B] uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Assessment Recommendation
                  </div>
                  <p className="text-gray-800 text-xs leading-relaxed">
                    Continued monitoring and support are recommended. Because the student has shown positive improvement with current interventions, formal psycho-educational evaluation is deferred at this time.
                  </p>
                </div>
                <div className="border border-amber-200 bg-amber-50/30 p-3 rounded">
                  <div className="font-bold text-amber-800 uppercase tracking-wider text-[10px] mb-1 font-mono">
                    Probability Classification
                  </div>
                  <p className="text-gray-800 text-xs leading-relaxed">
                    <strong>Moderate Probability</strong> — Working memory errors and delayed speed are present, but active responsiveness to support mitigates primary disability classification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase bg-teal-50 text-[#0D6E6E] px-2.5 py-1 rounded font-bold">
                  Publication Quality Output
                </span>
                <h3 className="text-2xl font-bold text-[#0F2231]" style={{ fontFamily: "'Georgia', serif" }}>
                  Standardized 3-Page Clinical A4 Assessment Report.
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Generates ready-to-print clinical documentation formatted for IEP meetings, special education directors, pediatricians, and parents.
                </p>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0D6E6E]" />
                    <span><strong>Page 1:</strong> Student Demographics, Sample Image, Timing, OCR, Domain Scores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0D6E6E]" />
                    <span><strong>Page 2:</strong> Diagnostic Tables, Basal/Ceiling Grades, Spelling Discrepancies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0D6E6E]" />
                    <span><strong>Page 3:</strong> Fluency Analysis, Clinical Interpretation, 3 Actionable Strategies</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#FAF9F5] p-6 rounded-xl border border-gray-200 text-center space-y-3">
                <div className="text-3xl font-mono font-black text-[#0F2231]">210mm × 297mm</div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Exact Fixed A4 Standard Dimension</p>
                <div className="flex justify-center gap-3 pt-2">
                  <span className="px-4 py-2 bg-[#0D6E6E] text-white rounded text-xs font-semibold shadow-xs">
                    Crisp Vector PDF
                  </span>
                  <span className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded text-xs font-semibold shadow-xs">
                    Structured DOCX Word
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ── SAMPLE REQUIREMENTS SECTION ── */}
      <section className="bg-[#EFECE6] py-20 border-y border-[#E2DDCF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6B7280] mb-2 font-mono font-semibold">
                Clinical Rigor
              </p>
              <h2 
                className="text-3xl font-bold text-[#0F2231] leading-snug"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                What you'll need for a clinically valid screening.
              </h2>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                To yield diagnostically sound metrics, samples must adhere to standard occupational therapy protocol.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { stat: '75–100', label: 'Minimum Words', desc: 'Student must write 75–100 words on unruled or lightly lined paper using their natural dominant hand.' },
                { stat: 'Grade 1–15', label: 'Calibrated Norms', desc: 'Norm-referenced from elementary schoolers through third-year college students with age-appropriate speed thresholds.' },
                { stat: '300 DPI', label: 'Capture Clarity', desc: 'Flat, even lighting without shadows so stroke pressure and letter geometry can be modeled reliably.' },
                { stat: '< 60s', label: 'Analysis Speed', desc: 'Complete structural diagnostic breakdown returned in less than one minute with instant report generation.' },
              ].map(({ stat, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-6 shadow-xs border border-[#E0D9CB]">
                  <p className="text-3xl font-black text-[#0D6E6E] mb-1 font-mono">{stat}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold font-mono">{label}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 3-STEP CLINICAL WORKFLOW ── */}
      <section className="py-20 lg:py-28 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#0D6E6E] font-mono font-semibold">
            Simple 3-Step Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F2231]" style={{ fontFamily: "'Georgia', serif" }}>
            From written page to comprehensive report.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Collect the Sample',
              desc: 'Have the student write 75–100 words in response to a simple prompt using their natural writing instrument on lined or plain paper.'
            },
            {
              step: '02',
              title: 'Capture or Upload',
              desc: 'Upload a clear photograph or use the integrated camera scanner with live edge alignment and interactive cropping.'
            },
            {
              step: '03',
              title: 'Review Clinical Report',
              desc: 'Instant diagnostic scoring with verbatim error mapping, WPM pacing breakdown, RTI classification, and PDF/Word export.'
            }
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white p-7 rounded-xl border border-[#D5CEBE] shadow-xs hover:shadow-md transition-shadow relative">
              <span className="text-3xl font-black text-[#0D6E6E]/20 font-mono absolute top-6 right-6">
                {step}
              </span>
              <h3 className="text-lg font-bold text-[#0F2231] mb-2.5">{title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-r from-[#0B1E2D] to-[#122B3D] text-white rounded-2xl p-10 lg:p-14 text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="text-xs font-mono uppercase tracking-widest text-[#2DD4BF] bg-white/10 px-3 py-1 rounded-full font-semibold">
              Clinical Assessment Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Georgia', serif" }}>
              Built for clinicians, special educators, and learning specialists.
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Start evaluating student handwriting samples with verified clinical norms, RTI progress tracking, and instant multi-page export.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="bg-[#0D6E6E] hover:bg-[#0B5C5C] text-white px-8 py-3.5 rounded-md font-semibold text-sm transition-all shadow-md inline-flex items-center justify-center gap-2"
              >
                <span>Launch GraphiaCheck</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onAbout}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-md font-medium text-sm transition-all"
              >
                Read Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLINICAL DISCLAIMER ── */}
      <section className="py-8 pb-16 max-w-6xl mx-auto px-6">
        <div className="border border-[#D1C7B7] bg-[#FAF8F5] rounded-xl p-6 text-xs text-[#556270] leading-relaxed flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-[#0D6E6E] shrink-0 mt-0.5" />
          <p>
            <strong>Clinical Disclaimer:</strong> GraphiaCheck is an assistive screening decision-support aid and does not constitute an independent medical diagnosis. Findings should be reviewed by a certified occupational therapist, educational psychologist, or learning disabilities specialist alongside multidisciplinary developmental history.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer onTerms={onTerms} onPrivacy={onPrivacy} onRefund={onRefund} />

    </div>
  );
}