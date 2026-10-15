import React, { memo } from "react";
import { ShieldCheck, Award, Lock, FileCheck, Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  onTerms?: () => void;
  onPrivacy?: () => void;
  onRefund?: () => void;
}

function Footer({ onTerms, onPrivacy, onRefund }: FooterProps) {
  return (
    <footer className="bg-[#0A1424] text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 mb-12 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BD7A5C]/15 border border-[#BD7A5C]/30 flex items-center justify-center text-[#BD7A5C] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">DSM-5 Criteria</p>
              <p className="text-[11px] text-slate-400">Written Expression Support</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Deterministic Norms</p>
              <p className="text-[11px] text-slate-400">Calibrated Grades 1–15</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BD7A5C]/15 border border-[#BD7A5C]/30 flex items-center justify-center text-[#BD7A5C] shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">3-Page A4 Standard</p>
              <p className="text-[11px] text-slate-400">Fixed Print Specification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Data Privacy</p>
              <p className="text-[11px] text-slate-400">Confidential Processing</p>
            </div>
          </div>
        </div>

        {/* Links & Brand Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0E1B2E] via-[#1D3557] to-[#0284C7] flex items-center justify-center text-white font-extrabold text-sm shadow-sm ring-1 ring-white/10 relative">
                G
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#BD7A5C] border-2 border-[#0A1424]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg tracking-tight">
                  Graphia<span className="text-[#0284C7]">Check</span>
                </span>
                <span className="text-[10px] font-mono text-[#BD7A5C] bg-[#BD7A5C]/20 border border-[#BD7A5C]/40 px-1.5 py-0.2 rounded-sm font-semibold">
                  CLINICAL
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md font-normal">
              MindSaid Learning Centre's evidence-based clinical decision-support platform modeling stroke geometry, spatial adherence, and cognitive fluency to assist specialists in detecting dysgraphia and written expression disorders.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#BD7A5C]" />
                <span>(+91) 89281 86952</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#BD7A5C]" />
                <span>contact@mindsaidlearning.com</span>
              </p>
            </div>
          </div>

          {/* Legal Links Col */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Governance & Policies
            </h4>
            <ul className="space-y-2 text-xs">
              {onTerms && (
                <li>
                  <button
                    onClick={onTerms}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
              )}
              {onPrivacy && (
                <li>
                  <button
                    onClick={onPrivacy}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
              )}
              {onRefund && (
                <li>
                  <button
                    onClick={onRefund}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Refund & Cancellation
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Clinical Support Col */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              MindSaid Learning Centre
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://mindsaidlearning.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-[#E8A588] transition-colors"
                >
                  www.mindsaidlearning.com
                </a>
              </li>
              <li>
                <span className="text-slate-500">
                  Psycho-educational Assessment & Intervention Centre
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MindSaid Learning Centre & GraphiaCheck™. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Engineered for clinical decision support. Not a standalone diagnostic tool.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);