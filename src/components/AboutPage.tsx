import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ArrowRight, ShieldCheck, CheckCircle2, Award, BookOpen, Brain, Activity, PenTool } from "lucide-react";

interface AboutPageProps {
  onBack: () => void;
  onAbout?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function AboutPage({ onBack, onAbout, onTerms, onPrivacy, onRefund }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0E1B2E] font-sans selection:bg-[#BD7A5C] selection:text-white">

      {/* ── NAVBAR ── */}
      <Navbar
        showBack
        onGetStarted={onBack}
        onAbout={onAbout}
        onLogin={onBack}
        activePage="about"
      />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-[#0E1B2E] via-[#122238] to-[#0A1424] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#BD7A5C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-semibold text-sky-200 mb-6">
            <Brain className="w-3.5 h-3.5 text-[#BD7A5C]" />
            Clinical Methodology & Scientific Framework
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-6 max-w-4xl tracking-tight">
            Handwriting is the earliest visible signal of how a learner thinks.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
            GraphiaCheck was built by MindSaid Learning Centre to give educators, clinicians, and learning specialists an objective, repeatable way to read that signal — without subjectivity, and across the full span of school years.
          </p>
        </div>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="py-20 bg-[#FAF8F5] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden h-80 bg-slate-900 shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80"
                alt="Handwriting close-up"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#BD7A5C] font-mono font-bold">
                Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0E1B2E] tracking-tight">
                Earlier signal. Better support.
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm font-normal">
                Dysgraphia is often identified late — sometimes years after a child has begun to compensate, hide, or disengage.
                GraphiaCheck shortens that gap by turning a single handwriting sample into a structured screening that can be reviewed, repeated, and tracked over time.
              </p>
              <p className="text-slate-700 text-sm font-medium">
                We don't replace specialists. We empower them with deterministic data to see more, sooner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT GRAPHIACHECK MEASURES ── */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#0284C7] font-mono font-bold">
              Diagnostic Dimensions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0E1B2E] tracking-tight">
              Five structural dimensions, one calibrated model.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Letter Formation', desc: 'Loop closure, proportion, reversals, and stroke geometry modeled against age-typical baselines.' },
              { title: 'Spacing & Alignment', desc: 'Inter-word spacing, baseline drift, and ascender-descender collision behavior across ruled paper.' },
              { title: 'Slant Consistency', desc: 'Angular variance per letter across the sample — an objective indicator of motor control and planning.' },
              { title: 'Line Quality & Tremor', desc: 'Stroke width variance, pressure irregularity, and muscular fatigue modeled through optical edge analysis.' },
              { title: 'Verbatim Fluency', desc: 'Cognitive writing speed (WPM) alongside active preservation of crossed-out self-corrections.' },
              { title: 'Grade-Normed Scoring', desc: "Every dimension is evaluated against verified norms calibrated from Grade 1 through College (Grade 15)." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-[#FAF8F5] rounded-2xl p-7 border border-slate-200/90 shadow-2xs hover:border-[#BD7A5C] transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-[#BD7A5C]/15 text-[#BD7A5C] flex items-center justify-center font-bold text-xs mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#0E1B2E] text-base mb-2">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW THE MODEL WORKS ── */}
      <section className="bg-[#F8FAFC] py-20 lg:py-28 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-14 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#0284C7] font-mono font-bold">
              The Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0E1B2E] tracking-tight">
              Built on structure, not style.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              GraphiaCheck doesn't compare handwriting samples to an arbitrary "neatness" standard. It measures structural features against calibrated norms for each grade band — separating developmental variation from indicators that warrant closer clinical review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Structural Extraction', desc: 'Computer vision identifies individual strokes, loop closures, baseline coordinates, and struck-through tokens.' },
              { step: '02', title: 'Norm Comparison', desc: 'Each dimension is measured against grade-band normative distributions calibrated from elementary school to college.' },
              { step: '03', title: 'Indicator Output', desc: 'The screening returns a standardized 3-page clinical report with RTI response tracking and actionable strategies.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-7 border border-slate-200 shadow-2xs">
                <p className="text-2xl font-black text-[#BD7A5C] font-mono mb-3">{step}</p>
                <h3 className="font-bold text-[#0E1B2E] mb-2">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPORTANT LIMITS ── */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-[#FAF8F5] border border-slate-200 rounded-3xl p-10 lg:p-14 shadow-xs space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#BD7A5C] font-mono font-bold">
              Clinical Guardrails
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0E1B2E] tracking-tight">
              A screening is an assistive tool, not an independent medical diagnosis.
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm max-w-3xl font-normal">
              GraphiaCheck identifies patterns that are structurally consistent with dysgraphia and written expression disorders. It is engineered to support certified clinicians, educational psychologists, and occupational therapists — not to replace multidisciplinary clinical evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-br from-[#0E1B2E] via-[#122238] to-[#0A1424] text-white rounded-3xl p-10 lg:p-14 text-center shadow-xl border border-slate-700">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Ready to run a screening?
          </h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto text-sm font-normal">
            Upload a student handwriting sample and receive a full structural diagnostic breakdown in under a minute.
          </p>
          <button
            onClick={onBack}
            className="bg-[#BD7A5C] hover:bg-[#A8694D] text-white px-9 py-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Launch GraphiaCheck Assessment</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer
        onTerms={onTerms}
        onPrivacy={onPrivacy}
        onRefund={onRefund}
      />
    </div>
  );
}