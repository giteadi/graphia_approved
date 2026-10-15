import React, { useState, memo } from "react";
import { ArrowLeft, Menu, X, Phone, Mail, ArrowRight } from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
  onAbout?: () => void;
  onGetStarted?: () => void;
  onHome?: () => void;
  onLogin?: () => void;
  activePage?: 'home' | 'about';
}

function Navbar({
  showBack = false,
  onAbout,
  onGetStarted,
  onHome,
  onLogin,
  activePage = 'home',
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      
      {/* ── MINDSAID TOP CLINICAL CONTACT BAR ── */}
      <div className="bg-[#0E1B2E] text-slate-300 text-[11px] py-1.5 px-6 border-b border-slate-800/80 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-sans">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-[#BD7A5C]" />
              <span>(+91) 89281 86952</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <Mail className="w-3 h-3 text-[#BD7A5C]" />
              <span>contact@mindsaidlearning.com</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BD7A5C]" />
            <span className="font-medium text-slate-300">MindSaid Learning Centre</span>
            <span className="text-slate-500">· Psycho-educational Assessment & Intervention</span>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR ── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">

          {/* Logo — MindSaid Brand Integration */}
          <button
            onClick={onHome || onGetStarted}
            className="flex items-center gap-3.5 group text-left transition-all"
          >
            {/* MindSaid Stylized Swirl Insignia */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0E1B2E] via-[#1D3557] to-[#0284C7] flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10 group-hover:scale-105 transition-transform relative overflow-hidden">
              <span className="font-extrabold text-sm tracking-tight text-white">G</span>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#BD7A5C] border-2 border-white" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0E1B2E] font-bold text-lg tracking-tight font-sans">
                  Graphia<span className="text-[#0284C7]">Check</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-[#BD7A5C] bg-[#BD7A5C]/10 border border-[#BD7A5C]/30 px-1.5 py-0.2 rounded-sm">
                  CLINICAL
                </span>
              </div>
              <span className="text-[10px] text-slate-500 tracking-wide font-medium hidden sm:inline">
                by MindSaid Learning Centre
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onHome || onGetStarted}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activePage === 'home'
                  ? 'bg-slate-100 text-[#0E1B2E] font-bold'
                  : 'text-slate-600 hover:text-[#0E1B2E] hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={onAbout}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activePage === 'about'
                  ? 'bg-slate-100 text-[#0E1B2E] font-bold'
                  : 'text-slate-600 hover:text-[#0E1B2E] hover:bg-slate-50'
              }`}
            >
              Clinical Methodology
            </button>

            <div className="h-4 w-px bg-slate-200 mx-2" />

            {/* MindSaid Warm Terracotta Pill CTA */}
            {onLogin && (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 bg-[#BD7A5C] hover:bg-[#A8694D] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Launch Assessment</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/90" />
              </button>
            )}

            {showBack && (
              <button
                onClick={onGetStarted}
                className="text-slate-700 text-xs hover:text-[#0E1B2E] px-3.5 py-2 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-medium ml-2"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 text-[#0E1B2E] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-6 py-4 space-y-2">
            <button
              onClick={() => {
                onHome?.();
                onGetStarted?.();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'home' ? 'bg-slate-100 text-[#0E1B2E]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                onAbout?.();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'about' ? 'bg-slate-100 text-[#0E1B2E]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Clinical Methodology
            </button>

            {onLogin && (
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#BD7A5C] text-white px-5 py-3 rounded-full text-sm font-bold shadow-sm"
              >
                <span>Launch Assessment</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}

            {showBack && (
              <button
                onClick={() => {
                  onGetStarted?.();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left text-slate-700 text-sm hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </nav>
        )}
      </header>
    </div>
  );
}

export default memo(Navbar);