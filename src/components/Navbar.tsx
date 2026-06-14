import { ArrowLeft } from "lucide-react";

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
          <span
            className="text-[#1a3a4a] font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            GraphiaCheck
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
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
              className="bg-[#1a5c6b] text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-[#154f5c] transition-colors"
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
      </div>
    </header>
  );
}