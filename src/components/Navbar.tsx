import { ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  showBack?: boolean;
  onAbout?: () => void;
  onGetStarted?: () => void;
  onHome?: () => void;
  onLogin?: () => void;
  activePage?: 'home' | 'about';
}

export default function Navbar({
  showBack = false,
  onAbout,
  onGetStarted,
  onHome,
  onLogin,
  activePage = 'home',
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#e0d9ce] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo — clicking logo goes Home */}
        <button
          onClick={onHome || onGetStarted}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-[#1a3a4a] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div className="flex items-start">
            <span
              className="text-[#1a3a4a] font-bold text-lg tracking-tight"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              GraphiaCheck
              <sup className="text-[9px] font-sans font-bold not-italic ml-0.5 opacity-60 tracking-normal">TM</sup>
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={onHome || onGetStarted}
            className={`text-sm transition-colors ${
              activePage === 'home' 
                ? 'text-[#1a5c6b] font-semibold border-b-2 border-[#1a5c6b] pb-1' 
                : 'text-[#1a1a2e] hover:text-[#1a3a4a]'
            }`}
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Home
          </button>

          <button
            onClick={onAbout}
            className={`text-sm transition-colors ${
              activePage === 'about' 
                ? 'text-[#1a5c6b] font-semibold border-b-2 border-[#1a5c6b] pb-1' 
                : 'text-[#1a1a2e] hover:text-[#1a3a4a]'
            }`}
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            About
          </button>

          {onLogin && (
            <button
              onClick={onLogin}
              className="bg-[#1a5c6b] text-white px-3 py-1.5 rounded-sm text-sm font-semibold hover:bg-[#154f5c] transition-colors"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Login
            </button>
          )}

          {showBack && (
            <button
              onClick={onGetStarted}   // ← was window.history.back(), now goes to Home
              className="text-[#1a1a2e] text-sm hover:text-[#1a3a4a] transition-colors flex items-center gap-1"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-[#e0d9ce] bg-white">
          <div className="px-6 py-4 flex flex-col gap-4">
            <button
              onClick={() => {
                onHome?.();
                onGetStarted?.();
                setIsMobileMenuOpen(false);
              }}
              className={`text-left text-sm transition-colors py-2 ${
                activePage === 'home' 
                  ? 'text-[#1a5c6b] font-semibold' 
                  : 'text-[#1a1a2e] hover:text-[#1a3a4a]'
              }`}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Home
            </button>

            <button
              onClick={() => {
                onAbout?.();
                setIsMobileMenuOpen(false);
              }}
              className={`text-left text-sm transition-colors py-2 ${
                activePage === 'about' 
                  ? 'text-[#1a5c6b] font-semibold' 
                  : 'text-[#1a1a2e] hover:text-[#1a3a4a]'
              }`}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              About
            </button>

            {onLogin && (
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="bg-[#1a5c6b] text-white px-3 py-1.5 rounded-sm text-sm font-semibold hover:bg-[#154f5c] transition-colors w-fit"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Login
              </button>
            )}

            {showBack && (
              <button
                onClick={() => {
                  onGetStarted?.();
                  setIsMobileMenuOpen(false);
                }}
                className="text-[#1a1a2e] text-sm hover:text-[#1a3a4a] transition-colors flex items-center gap-1 py-2"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}