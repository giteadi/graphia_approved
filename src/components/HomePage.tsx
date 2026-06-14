import { ArrowRight } from 'lucide-react';
import Navbar from "./Navbar";

interface HomePageProps {
  onGetStarted: () => void;
  onHome: () => void;
  onAbout: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function HomePage({ onGetStarted, onHome, onAbout, onTerms, onPrivacy, onRefund }: HomePageProps) {
  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="min-h-screen bg-[#F5F0E8] text-[#1a1a2e]">

      {/* ── NAVBAR ── */}
      <Navbar
        showBack={false}
        onGetStarted={onGetStarted}
        onHome={onHome}
        onAbout={onAbout}
        onLogin={onGetStarted}
        activePage="home"
      />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 border border-[#c8c0b0] rounded-full px-4 py-1 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#e07a3a] inline-block"></span>
              <span className="text-xs uppercase tracking-widest text-[#555] font-medium" style={{ fontFamily: "system-ui, sans-serif" }}>
                Clinical Demo · Grade 1 – 15th Year
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6 text-[#1a1a2e]">
              Welcome to{' '}
              <span className="text-[#1a5c6b] italic">GraphiaCheck</span>
              <span className="ml-2">🎓</span>
            </h1>

            <p className="text-lg text-[#555] leading-relaxed mb-10" style={{ fontFamily: "system-ui, sans-serif" }}>
              A clinical diagnostic tool that evaluates handwriting samples for characteristics associated with{' '}
              <strong className="text-[#1a1a2e]">dysgraphia</strong>.
              Fully calibrated for students from Grade 1 through the 15th Year — the third year of college.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="bg-[#1a5c6b] text-white px-8 py-3.5 rounded-sm font-semibold hover:bg-[#154f5c] transition-colors text-sm"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Sign in to GraphiaCheck
              </button>
              <button
                onClick={onAbout}
                className="border border-[#1a1a2e] text-[#1a1a2e] px-8 py-3.5 rounded-sm font-semibold hover:bg-[#1a1a2e] hover:text-white transition-colors text-sm flex items-center gap-2"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                About the tool <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero video */}
          <div className="rounded-2xl overflow-hidden shadow-md h-80 lg:h-96 bg-[#e8e0d0] flex items-center justify-center p-2">
            <video
              src="https://res.cloudinary.com/bazeercloud/video/upload/v1781325911/ye_graphia_che_kwebsite_bnai_h_tji1sa.mp4"
              controls
              controlsList="nodownload"
              autoPlay
              muted
              loop
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* ── SAMPLE REQUIREMENTS ── */}
      <section className="bg-[#ece7dd] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Left label */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#777] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
                Sample Requirements
              </p>
              <h2 className="text-3xl font-bold text-[#1a1a2e] leading-snug">
                What you'll need for a clinically valid screening.
              </h2>
            </div>

            {/* 2×2 grid of cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { stat: '75–100', label: 'Minimum Words', desc: 'Student must write 75–100 words on unruled or lightly lined paper using their natural/dominant hand for clinical validity.' },
                { stat: 'Grade 1 – 15', label: 'Calibrated Range', desc: 'Norm-referenced from elementary writers through third-year college, with age-appropriate baselines.' },
                { stat: '300 DPI', label: 'Capture Clarity', desc: 'The sample must be captured with absolute clarity so stroke geometry can be modeled accurately.' },
                { stat: '< 60s', label: 'Analysis Time', desc: 'Most screenings return a full structural breakdown in under a minute.' },
              ].map(({ stat, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-3xl font-bold text-[#1a5c6b] mb-1">{stat}</p>
                  <p className="text-xs uppercase tracking-widest text-[#888] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>{label}</p>
                  <p className="text-sm text-[#555] leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-[#777] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
            How It Works
          </p>
          <h2 className="text-4xl font-bold text-[#1a1a2e] mb-12">Three steps from page to screening.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 'Step 1', title: 'Collect the sample', desc: 'Have the student write 75–100 words on blank or lightly lined paper using their dominant hand.' },
              { step: 'Step 2', title: 'Capture with clarity', desc: 'Photograph or scan the page in even light. Sharp focus and full-page framing are required for structural modeling.' },
              { step: 'Step 3', title: 'Upload/Run screening', desc: 'Upload the sample to generate the report and view the screening results.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 shadow-sm border border-[#e8e0d0]">
                <p className="text-sm font-semibold text-[#e07a3a] mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>{step}</p>
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEOS ── */}
      <section className="bg-[#ece7dd] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-[#777] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
            Watch the Demo
          </p>
          <h2 className="text-4xl font-bold text-[#1a1a2e] mb-3">See GraphiaCheck in action.</h2>
          <p className="text-[#666] mb-10 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
            Two short walkthroughs — collecting a valid sample, and reading a screening report.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a2e] rounded-xl overflow-hidden shadow-md">
              <div className="aspect-video relative">
                <video
                  src="https://res.cloudinary.com/bazeercloud/video/upload/v1781326946/Graphia3.mp4"
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white px-5 py-4">
                <p className="text-sm font-medium text-[#1a1a2e]" style={{ fontFamily: "system-ui, sans-serif" }}>GraphiaCheck Website Demo</p>
              </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-xl overflow-hidden shadow-md">
              <div className="aspect-video relative">
                <video
                  src="https://res.cloudinary.com/bazeercloud/video/upload/v1781326820/Graphia2.mp4"
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white px-5 py-4">
                <p className="text-sm font-medium text-[#1a1a2e]" style={{ fontFamily: "system-ui, sans-serif" }}>GraphiaCheck English Version</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#999] mt-4" style={{ fontFamily: "system-ui, sans-serif" }}>
            Demo videos are illustrative placeholders. Replace with your own walkthrough recordings.
          </p>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-[#e0d9ce] rounded-2xl p-14 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-[#1a1a2e] mb-4">
              Built for clinicians, educators, and learning specialists.
            </h2>
            <p className="text-[#666] mb-8 max-w-xl mx-auto text-sm leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>
              GraphiaCheck is a screening aid — not a diagnosis. Learn more about the model, its calibration, and how to interpret results.
            </p>
            <button
              onClick={onAbout}
              className="bg-[#1a5c6b] text-white px-8 py-3.5 rounded-sm font-semibold hover:bg-[#154f5c] transition-colors text-sm"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Read about GraphiaCheck
            </button>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border border-[#c8b89a] bg-[#fdf8f0] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2L2 17h16L10 2z" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                  <path d="M10 8v4M10 14.5v.5" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#b45309] mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>
                  Disclaimer
                </p>
                <p className="text-xs text-[#6b5c45] leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>
                  This report was generated using an AI-powered tool that analyzes handwriting samples for characteristics associated with dysgraphia.
                  Please note that the handwriting samples submitted for analysis must be sufficiently legible for the AI-powered tool to process and generate an accurate report.
                  Illegible or unclear samples may affect the quality and reliability of the findings.
                  Before being shared, the AI-generated findings in this report were carefully reviewed and vetted by a Special Educator (Learning Disabilities Specialist)
                  to ensure accuracy, clinical relevance, and appropriateness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#ece7dd] border-t border-[#d8d0c4] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#888]" style={{ fontFamily: "system-ui, sans-serif" }}>
            © 2026 GraphiaCheck Demo. A clinical handwriting screening tool for educators and specialists.
          </p>
          <div className="flex gap-6 text-xs text-[#888]" style={{ fontFamily: "system-ui, sans-serif" }}>
            <button onClick={onPrivacy} className="hover:text-[#1a3a4a] transition-colors">Privacy</button>
            <button onClick={onTerms} className="hover:text-[#1a3a4a] transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}