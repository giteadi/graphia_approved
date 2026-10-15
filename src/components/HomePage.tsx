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
  Check,
  Zap,
  Target,
  Scan,
  Download,
  Award,
  BookOpen,
  HelpCircle,
  Star,
  Quote
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
  const [activeFeatureTab, setActiveFeatureTab] = useState<'vision' | 'transcription' | 'rti' | 'report'>('vision');

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0E1B2E] font-sans selection:bg-[#BD7A5C] selection:text-white">

      {/* ── NAVBAR ── */}
      <Navbar
        showBack={false}
        onGetStarted={onGetStarted}
        onHome={onHome}
        onAbout={onAbout}
        onLogin={onGetStarted}
        activePage="home"
      />

      {/* ── HERO SECTION (MindSaid Deep Twilight Navy & Warm Terracotta) ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0E1B2E] via-[#122238] to-[#0A1424] text-white pt-16 pb-24 lg:pt-24 lg:pb-36 border-b border-slate-800">
        
        {/* Ambient Warm Terracotta & Ocean Blue Light Glows */}
        <div className="absolute top-0 left-1/4 w-[650px] h-[650px] bg-[#BD7A5C]/[0.14] rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-[#0284C7]/[0.12] rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle Precision Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#FFFFFF 1.2px, transparent 1.2px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-7">
              
              {/* Clinical Eyebrow Pill */}
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#BD7A5C] ring-4 ring-[#BD7A5C]/30 animate-pulse" />
                <span className="text-xs font-semibold text-sky-200 tracking-wide">
                  Personalized Clinical Decision Support · Grades 1–15 Norms
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                Precision Dysgraphia Screening.{' '}
                <span className="bg-gradient-to-r from-sky-300 via-white to-[#E8A588] bg-clip-text text-transparent">
                  Powered by Computer Vision.
                </span>
              </h1>

              {/* Lead Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
                An evidence-based screening platform by MindSaid Learning Centre that objectively models stroke geometry, baseline deviation, and cognitive fluency to assist clinicians, psychologists, and educators in detecting written expression disorders.
              </p>

              {/* Action Buttons (MindSaid Signature Warm Terracotta Pill) */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3.5 sm:items-center">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#BD7A5C] to-[#C08261] hover:from-[#A8694D] hover:to-[#B07353] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-[0_10px_25px_-5px_rgba(189,122,92,0.45)] hover:shadow-[0_15px_35px_-5px_rgba(189,122,92,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <span>Launch Screening Assessment</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={onAbout}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-7 py-4 rounded-full font-semibold text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#BD7A5C]" />
                  <span>Clinical Methodology</span>
                </button>
              </div>

              {/* Quick Trust Highlights (Frosted Glass Tiles) */}
              <div className="pt-4 grid grid-cols-3 gap-3.5 max-w-xl">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 hover:border-[#BD7A5C]/50 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#BD7A5C]" />
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">Min Sample</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">75–100</div>
                  <div className="text-[10px] text-slate-400 font-medium">Standard Word Count</div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 hover:border-[#0284C7]/50 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">Speed</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">&lt; 60s</div>
                  <div className="text-[10px] text-slate-400 font-medium">Deterministic Time</div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 hover:border-[#BD7A5C]/50 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Award className="w-3.5 h-3.5 text-[#BD7A5C]" />
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#E8A588]">Standard</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">3 Pages</div>
                  <div className="text-[10px] text-slate-400 font-medium">Fixed A4 Clinical PDF</div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Diagnostic Computer Vision Scanner Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Radiant Ambient Glow Behind Showcase */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#BD7A5C]/25 via-[#0284C7]/20 to-[#BD7A5C]/20 rounded-3xl blur-2xl opacity-75" />

                {/* Primary Card Container */}
                <div className="relative bg-[#0A1424] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl ring-1 ring-white/10">
                  
                  {/* Card Title Bar */}
                  <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between text-white border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
                      <span className="text-xs font-mono tracking-wider font-bold uppercase text-slate-200">
                        Computer Vision Engine
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-[#BD7A5C]/20 text-[#E8A588] border border-[#BD7A5C]/40 px-2 py-0.5 rounded font-semibold">
                      LIVE INFERENCE · 48ms
                    </span>
                  </div>

                  {/* Image Viewport with Animated Laser Scan Line */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src="/hero_handwriting_ai.jpg"
                      alt="Computer vision analysis of handwriting strokes and neural metrics"
                      className="w-full h-full object-cover opacity-90 contrast-105"
                    />

                    {/* Laser Scan Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_12px_#38bdf8] animate-scan-line pointer-events-none" />

                    {/* Holographic Vision Detection Box Overlay */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-14 border border-dashed border-sky-400/70 bg-sky-500/10 rounded flex flex-col justify-between p-1 pointer-events-none backdrop-blur-[1px]">
                      <span className="text-[8px] font-mono text-sky-200 font-bold tracking-tight">LOOP_CLOSURE: 0.94</span>
                      <span className="text-[8px] font-mono text-[#E8A588] self-end">SLANT: 12.4°</span>
                    </div>

                    {/* Floating Diagnostic Score Chips */}
                    <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/15 shadow-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                      <span>Formation Score: <strong className="text-sky-300">75/100</strong></span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/15 shadow-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#BD7A5C] shadow-[0_0_8px_#bd7a5c]" />
                      <span>Baseline Alignment: <strong className="text-[#E8A588]">85/100</strong></span>
                    </div>
                  </div>

                  {/* Diagnostic Summary Snapshot Bar */}
                  <div className="p-4 bg-slate-900 border-t border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#BD7A5C]" />
                        Classification:
                      </span>
                      <span className="font-bold text-[#E8A588] bg-[#BD7A5C]/20 px-2.5 py-0.5 rounded-md border border-[#BD7A5C]/40 font-mono text-[11px]">
                        Moderate Probability (RTI Active)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        Writing Fluency:
                      </span>
                      <span className="font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30 font-mono text-[11px] flex items-center gap-1">
                        9 WPM <span className="text-slate-400 font-normal">(Norm: 20–30)</span>
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Calibrated for Grade 12 Norms
                      </span>
                      <span className="text-sky-300 font-mono font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded">
                        100% Deterministic
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: MINDSAID QUESTION HOOK ("Is my child or student struggling?") ── */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Leonardo Da Vinci Artwork Frame */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative group bg-slate-900">
                <img 
                  src="/sketch_handwriting_neuro.jpg"
                  alt="Leonardo da Vinci style medical sketch illustrating hand neurology and brain cognitive pathways"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                
                {/* Artwork caption bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0E1B2E] via-[#0E1B2E]/90 to-transparent p-5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 font-mono gap-2 border-t border-white/10">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#BD7A5C]" />
                    Fig 1.1: Neurological Graphology & Motor Cortex Mapping
                  </span>
                  <span className="text-sky-300 font-semibold bg-sky-950/80 border border-sky-800 px-2.5 py-0.5 rounded-full w-fit">
                    DSM-5 Aligned Criteria
                  </span>
                </div>
              </div>
            </div>

            {/* Content (Inspired directly by MindSaid Question Section) */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              
              {/* Circular Terracotta Help Icon */}
              <div className="w-12 h-12 rounded-full bg-[#BD7A5C]/15 text-[#BD7A5C] flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0E1B2E] tracking-tight leading-tight">
                Is handwriting friction masking high-level intelligence?
              </h2>

              <p className="text-base font-semibold text-[#BD7A5C]">
                Early structural identification is key to targeted intervention.
              </p>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-normal">
                Dysgraphia is not mere poor penmanship. When the physical mechanics of forming letters consume excessive cognitive resources, working memory collapses under mechanical load — preventing students from expressing what they actually know.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#BD7A5C]/15 text-[#BD7A5C] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0E1B2E]">Fine Motor Loop Execution</h4>
                    <p className="text-xs text-slate-500">Evaluates pen pressure, loop closure, and baseline drift across ruled paper.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#BD7A5C]/15 text-[#BD7A5C] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0E1B2E]">Orthographic Working Memory</h4>
                    <p className="text-xs text-slate-500">Separates developmental spelling from motor omission, preserving self-corrections.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#BD7A5C]/15 text-[#BD7A5C] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0E1B2E]">Response to Intervention (RTI)</h4>
                    <p className="text-xs text-slate-500">Caps formal diagnostic labels when students demonstrate progress under support.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 bg-[#BD7A5C] hover:bg-[#A8694D] text-white px-7 py-3.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>Take The Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: INTERACTIVE DIAGNOSTIC ENGINE ── */}
      <section className="py-20 lg:py-28 bg-[#F8FAFC] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#0284C7] font-mono font-bold">
              Clinical Diagnostic Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E1B2E]">
              How GraphiaCheck evaluates writing.
            </h2>
            <p className="text-sm text-slate-600 font-normal">
              Select a diagnostic domain to explore how computer vision and normative engines process student samples.
            </p>
          </div>

          {/* Feature Navigation Tabs (Segmented Pill Switch) */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-200/80 backdrop-blur-md rounded-full max-w-3xl mx-auto mb-10 border border-slate-300">
            {[
              { id: 'vision', label: 'Stroke Geometry & Alignment', icon: PenTool },
              { id: 'transcription', label: 'OCR & Error Mapping', icon: FileText },
              { id: 'rti', label: 'RTI Progress & Probability', icon: Activity },
              { id: 'report', label: '3-Page Clinical Report', icon: Download },
            ].map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0E1B2E] text-white shadow-md'
                      : 'text-slate-600 hover:text-[#0E1B2E] hover:bg-white/70'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#E8A588]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-xl shadow-slate-200/50">
            
            {activeFeatureTab === 'vision' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-5">
                  <span className="text-[11px] font-mono uppercase bg-[#BD7A5C]/15 text-[#BD7A5C] border border-[#BD7A5C]/30 px-3.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                    <PenTool className="w-3 h-3" />
                    Motor & Spatial Analysis
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0E1B2E] tracking-tight leading-snug">
                    Geometric measurement of baseline adherence and letter slant.
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    The computer vision pipeline measures spacing between individual words, ascender-descender collisions, and baseline drift across ruled paper down to fractional millimeter tolerances.
                  </p>
                  <div className="space-y-3 pt-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span>Calculates <strong>Letter Formation Score (0–100)</strong> based on circular loop closure.</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span>Evaluates <strong>Spatial Alignment Score (0–100)</strong> against printed rule lines.</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span>Detects writing tremor, excessive pen pressure variations, and muscular fatigue.</span>
                    </div>
                  </div>
                </div>

                {/* Visual Metric Gauges Card */}
                <div className="bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500">Diagnostic Parameter</span>
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500">Score & Norm Status</span>
                  </div>

                  {/* Metric 1 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Letter Formation</span>
                      <span className="text-[#0E1B2E] font-mono font-bold">75 / 100 · Adequate</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#0E1B2E] h-full rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Spatial Alignment</span>
                      <span className="text-[#0284C7] font-mono font-bold">85 / 100 · Competent</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#0284C7] h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Writing Fluency (Speed)</span>
                      <span className="text-rose-600 font-mono font-bold">9 WPM · Needs Support</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: '32%' }} />
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">Line Quality & Tremor</span>
                      <span className="text-[#BD7A5C] font-mono font-bold">65 / 100 · Needs Attention</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#BD7A5C] h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'transcription' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-5">
                  <span className="text-[11px] font-mono uppercase bg-[#BD7A5C]/15 text-[#BD7A5C] border border-[#BD7A5C]/30 px-3.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-[#BD7A5C]" />
                    Verbatim OCR & Self-Correction
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0E1B2E] tracking-tight leading-snug">
                    Preserves crossed-out words as active self-monitoring evidence.
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Standard OCR tools discard struck-through text. GraphiaCheck explicitly catalogs cancellations (<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono font-semibold">[CANCELLED: word]</code>), recognizing them as positive metacognitive self-corrections rather than penalizing them as spelling mistakes.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-mono font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      Spelling Error (Phonetic)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-mono font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      Grammar Lapsus
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-300 rounded-full font-mono line-through font-medium">
                      Cancelled (Self-Corrected)
                    </span>
                  </div>
                </div>

                {/* Sample OCR Interactive Card */}
                <div className="bg-[#0E1B2E] text-slate-100 p-6 rounded-2xl border border-slate-800 font-mono text-xs space-y-3 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Verbatim Handwriting OCR</span>
                    <span className="text-[#38BDF8] text-[10px]">Confidence: 99.2%</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 leading-6 text-sm">
                    "Letters would still be the main form of communication and{" "}
                    <span className="bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 px-1 font-semibold">tetlephones</span>{" "}
                    would still be used{" "}
                    <span className="bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 px-1 font-semibold">conmenly</span>. One could argue that life would be simpler because{" "}
                    <span className="line-through text-slate-500 bg-slate-800 px-1 rounded">[there wo]</span>{" "}
                    the world would be less{" "}
                    <span className="bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 px-1 font-semibold">critisizing</span>..."
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * Struck-through text detected: 1 word, excluded from spelling error tally.
                  </p>
                </div>
              </div>
            )}

            {activeFeatureTab === 'rti' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-5">
                  <span className="text-[11px] font-mono uppercase bg-sky-50 text-sky-800 border border-sky-200 px-3.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-sky-700" />
                    Tiered Intervention Alignment
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0E1B2E] tracking-tight leading-snug">
                    Clinical probability capped when interventions show progress.
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    In strict compliance with DSM-5 guidelines, if a student demonstrates positive progress under current classroom accommodations or occupational therapy, probability is appropriately capped at <strong>MODERATE</strong> and formal psycho-educational testing is deferred.
                  </p>
                  <div className="p-4 bg-sky-50/80 border-l-4 border-[#0284C7] rounded-r-xl text-xs text-sky-950 leading-relaxed font-medium">
                    <strong>Clinical Decision Rule:</strong> When Response to Intervention (RTI) is active and positive, students receive actionable strategies without alarming diagnosis labels.
                  </div>
                </div>

                {/* RTI Decision Card */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
                  <div className="border border-[#BD7A5C]/40 bg-[#BD7A5C]/10 p-4 rounded-xl">
                    <div className="font-bold text-[#8C5338] uppercase tracking-wider text-[11px] mb-1 font-mono flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#BD7A5C]" />
                      Probability Classification
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed font-medium">
                      <strong>Moderate Probability</strong> — Working memory errors and delayed speed are present, but active responsiveness to support mitigates primary disability classification.
                    </p>
                  </div>

                  <div className="border border-[#0284C7]/30 bg-sky-50/60 p-4 rounded-xl">
                    <div className="font-bold text-[#0A4B78] uppercase tracking-wider text-[11px] mb-1 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7]" />
                      Assessment Recommendation
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed font-medium">
                      Continued monitoring and support are recommended. Because the student has shown positive improvement with current interventions, formal psycho-educational evaluation is deferred at this time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'report' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-5">
                  <span className="text-[11px] font-mono uppercase bg-[#BD7A5C]/15 text-[#BD7A5C] border border-[#BD7A5C]/30 px-3.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                    <Download className="w-3 h-3 text-[#BD7A5C]" />
                    Publication Quality Output
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0E1B2E] tracking-tight leading-snug">
                    Standardized 3-Page Clinical A4 Assessment Report.
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Generates ready-to-print clinical documentation formatted for IEP meetings, special education directors, pediatricians, and parents.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span><strong>Page 1:</strong> Student Demographics, Sample Image, Timing, OCR, Domain Scores</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span><strong>Page 2:</strong> Diagnostic Tables, Basal/Ceiling Grades, Spelling Discrepancies</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#BD7A5C] shrink-0" />
                      <span><strong>Page 3:</strong> Fluency Analysis, Clinical Interpretation, 3 Actionable Strategies</span>
                    </div>
                  </div>
                </div>

                {/* Report Export Preview */}
                <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="text-4xl font-mono font-black text-[#0E1B2E] tracking-tight">210mm × 297mm</div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-mono font-semibold">Exact Fixed A4 Standard Dimension</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <span className="px-6 py-2.5 bg-[#BD7A5C] text-white rounded-full text-xs font-bold shadow-xs inline-flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Crisp Vector PDF
                    </span>
                    <span className="px-6 py-2.5 bg-white text-[#0E1B2E] border border-slate-300 rounded-full text-xs font-semibold shadow-xs">
                      Structured DOCX Word
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ── SECTION 4: SAMPLE REQUIREMENTS BENTO GRID ── */}
      <section className="bg-[#FAF8F5] py-20 lg:py-28 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            <div className="lg:col-span-4 space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#BD7A5C] font-mono font-bold">
                Clinical Rigor & Protocol
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0E1B2E] tracking-tight leading-snug">
                What you'll need for a clinically valid screening.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                To yield diagnostically sound metrics, samples must adhere to standard occupational therapy protocol across word volume, imaging clarity, and normative age reference.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { 
                  stat: '75–100', 
                  label: 'Minimum Words', 
                  desc: 'Student must write 75–100 words on unruled or lightly lined paper using their natural dominant hand to evaluate fatigue.',
                  badge: 'Standard Protocol'
                },
                { 
                  stat: 'Grade 1–15', 
                  label: 'Calibrated Norms', 
                  desc: 'Norm-referenced from elementary schoolers through third-year college students with age-appropriate speed thresholds.',
                  badge: 'DSM-5 Referenced'
                },
                { 
                  stat: '300 DPI', 
                  label: 'Capture Clarity', 
                  desc: 'Flat, even lighting without shadows so stroke pressure, baseline drift, and letter geometry can be modeled reliably.',
                  badge: 'Optical Quality'
                },
                { 
                  stat: '< 60s', 
                  label: 'Analysis Speed', 
                  desc: 'Complete structural diagnostic breakdown returned in less than one minute with instant clinical report generation.',
                  badge: 'Deterministic'
                },
              ].map(({ stat, label, desc, badge }) => (
                <div key={label} className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 hover:border-[#BD7A5C] transition-all hover:shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-black text-[#BD7A5C] font-mono tracking-tight group-hover:scale-105 transition-transform">{stat}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">{badge}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-[#0E1B2E] mb-1.5 font-bold font-mono">{label}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: SPECIALIST & EDUCATOR TESTIMONIALS (MindSaid Exact Styling) ── */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#0284C7] font-mono font-bold">
              Specialist & Client Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0E1B2E] tracking-tight">
              What Specialists & Educators Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Testimonial Card 1 */}
            <div className="bg-[#FAF8F5] rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-4">
                {/* Terracotta Quote Icon */}
                <div className="text-[#BD7A5C] opacity-80">
                  <Quote className="w-10 h-10 rotate-180" />
                </div>
                <h3 className="text-xl font-bold text-[#0E1B2E]">A Game-Changer for Diagnostic Speed!</h3>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  "MindSaid's GraphiaCheck platform removed the guesswork from our handwriting evaluations. The objective stroke geometry and automatic 3-page clinical report provide parents and IEP committees with undeniable clarity. We've seen remarkable progress in student accommodations."
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/80 mt-6">
                <p className="font-bold text-[#BD7A5C] text-sm">Mrs. Mehta</p>
                <p className="text-xs text-slate-500">Senior Special Educator & Parent Liaison</p>
              </div>
            </div>

            {/* Testimonial Card 2 */}
            <div className="bg-[#FAF8F5] rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-4">
                {/* Terracotta Quote Icon */}
                <div className="text-[#BD7A5C] opacity-80">
                  <Quote className="w-10 h-10 rotate-180" />
                </div>
                <h3 className="text-xl font-bold text-[#0E1B2E]">Empowering and Rigorous Decision Support</h3>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  "The preservation of crossed-out words as positive self-monitoring evidence, paired with DSM-5 aligned RTI progress tracking, makes this the most clinically respectful tool we have ever used. It gives actionable strategies rather than rushed labels."
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/80 mt-6">
                <p className="font-bold text-[#BD7A5C] text-sm">Mr. Sharma</p>
                <p className="text-xs text-slate-500">Educational Psychologist & Learning Specialist</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 6: CTA BANNER (MindSaid Deep Twilight Navy) ── */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-[#0E1B2E] via-[#122238] to-[#0A1424] text-white rounded-3xl p-10 lg:p-16 text-center shadow-2xl relative overflow-hidden border border-slate-700">
          
          {/* Glowing Aura in CTA */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#BD7A5C]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-300 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full font-bold">
              MindSaid Clinical Assessment Portal
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Empowering Every Mind, One Objective Screening at a Time.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Start evaluating student handwriting samples with verified clinical norms, RTI progress tracking, and instant multi-page export.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3.5">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#BD7A5C] to-[#C08261] hover:from-[#A8694D] hover:to-[#B07353] text-white px-9 py-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch GraphiaCheck</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={onAbout}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-4 rounded-full font-semibold text-sm transition-all cursor-pointer"
              >
                Read Methodology
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: CLINICAL DISCLAIMER ── */}
      <section className="py-6 pb-16 max-w-7xl mx-auto px-6">
        <div className="border border-slate-200 bg-[#FAF8F5] rounded-2xl p-6 text-xs text-slate-600 leading-relaxed flex items-start gap-4 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-[#BD7A5C] shrink-0 mt-0.5" />
          <p className="font-normal">
            <strong className="text-[#0E1B2E] font-semibold">Clinical Disclaimer:</strong> GraphiaCheck is an assistive screening decision-support aid and does not constitute an independent medical diagnosis. Findings should be reviewed by a certified occupational therapist, educational psychologist, or learning disabilities specialist alongside multidisciplinary developmental history.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer onTerms={onTerms} onPrivacy={onPrivacy} onRefund={onRefund} />

    </div>
  );
}