import Navbar from "./Navbar";
import Footer from "./Footer";

interface AboutPageProps {
  onBack: () => void;
  onAbout?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

export default function AboutPage({ onBack, onAbout, onTerms, onPrivacy, onRefund }: AboutPageProps) {
  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="min-h-screen bg-[#F5F0E8] text-[#1a1a2e]">

      {/* ── NAVBAR ── */}
      <Navbar
        showBack
        onGetStarted={onBack}
        onAbout={onAbout}
        onLogin={onBack}
        activePage="about"
      />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest text-[#777] mb-4 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
          About
        </p>
        <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-[#1a1a2e] mb-6 max-w-3xl">
          Handwriting is the earliest visible signal of how a learner thinks.
        </h1>
        <p className="text-lg text-[#555] leading-relaxed max-w-2xl" style={{ fontFamily: "system-ui, sans-serif" }}>
          GraphiaCheck was built to give educators, clinicians, and learning specialists a structural, repeatable way to read that signal — without subjectivity, and across the full span of school years.
        </p>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="bg-[#ece7dd] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden h-72 bg-[#d8d0c4]">
              <img
                src="https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80"
                alt="Handwriting close-up"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#e07a3a] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
                Our Mission
              </p>
              <h2 className="text-4xl font-bold text-[#1a1a2e] mb-5">Earlier signal. Better support.</h2>
              <p className="text-[#555] leading-relaxed mb-4 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
                Dysgraphia is often identified late — sometimes years after a child has begun to compensate, hide, or disengage.
                GraphiaCheck shortens that gap by turning a single handwriting sample into a structured screening that can be reviewed, repeated, and tracked over time.
              </p>
              <p className="text-[#555] text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
                We don't replace specialists. We help them see more, sooner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT GRAPHIACHECK MEASURES ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-[#777] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
            What GraphiaCheck Measures
          </p>
          <h2 className="text-4xl font-bold text-[#1a1a2e] mb-12">Five structural dimensions, one calibrated model.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'Letter formation', desc: 'Closure, proportion, reversals, and stroke order — modeled against age-typical baselines.' },
              { title: 'Spacing & alignment', desc: 'Inter-letter and inter-word spacing, baseline drift, and margin behavior across the page.' },
              { title: 'Slant consistency', desc: 'Angular variance per letter and across the sample — a signal of motor control and planning.' },
              { title: 'Pressure & weight', desc: 'Stroke darkness and stroke width inferred from a high-clarity capture.' },
              { title: 'Fluency & cadence', desc: 'Connected vs. broken strokes, hesitations, retraces, and corrective marks.' },
              { title: 'Grade-normed scoring', desc: "Every dimension is interpreted against the calibrated range for the student's grade — from Grade 1 to the 15th Year." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-[#e8e0d0] shadow-sm">
                <h3 className="font-bold text-[#1a1a2e] mb-3">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW THE MODEL WORKS ── */}
      <section className="bg-[#ece7dd] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-[#777] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
            The Model
          </p>
          <h2 className="text-4xl font-bold text-[#1a1a2e] mb-6">Built on structure, not style.</h2>
          <p className="text-[#555] max-w-2xl leading-relaxed mb-12 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
            GraphiaCheck doesn't compare handwriting samples to a "good" or "bad" standard. It measures structural features against calibrated norms for each grade band — separating developmental variation from indicators that warrant closer review.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Structural extraction', desc: 'The model identifies strokes, spacing units, and letterforms from the raw image.' },
              { step: '02', title: 'Norm comparison', desc: 'Each dimension is measured against grade-band norms, not a universal ideal.' },
              { step: '03', title: 'Indicator output', desc: 'The screening returns a structured breakdown — not a diagnosis, but a readable signal.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 border border-[#e8e0d0] shadow-sm">
                <p className="text-3xl font-bold text-[#e0d9ce] mb-4">{step}</p>
                <h3 className="font-bold text-[#1a1a2e] mb-3">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPORTANT LIMITS ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-[#e8e0d0] rounded-2xl p-12 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-[#e07a3a] mb-3 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
              Important Limits
            </p>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-5">A screening is not a diagnosis.</h2>
            <p className="text-[#555] leading-relaxed max-w-2xl text-sm mb-6" style={{ fontFamily: "system-ui, sans-serif" }}>
              GraphiaCheck identifies patterns that are structurally consistent with dysgraphia. It does not diagnose the condition.
              A positive screening should lead to conversation with a qualified specialist — an educational psychologist, occupational therapist, or speech-language pathologist.
            </p>
            <p className="text-[#555] leading-relaxed max-w-2xl text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
              GraphiaCheck is a tool for professionals. Results should always be interpreted in context, with knowledge of the student and their history.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#ece7dd] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-[#1a1a2e] mb-4">Ready to run a screening?</h2>
          <p className="text-[#666] mb-4 max-w-xl mx-auto text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
            Upload a handwriting sample and receive a full structural breakdown in under a minute.
          </p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800" style={{ fontFamily: "system-ui, sans-serif" }}>
              <span className="font-semibold">ℹ️ Note:</span> When you click on "Ready to Run a Screening", it redirects you to the Build for Clinician section.
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-[#1a5c6b] text-white px-8 py-3.5 rounded-sm font-semibold hover:bg-[#154f5c] transition-colors text-sm"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Go to GraphiaCheck
          </button>
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
      <Footer
        onTerms={onTerms}
        onPrivacy={onPrivacy}
        onRefund={onRefund}
      />
    </div>
  );
}