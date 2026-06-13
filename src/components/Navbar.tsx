import { ArrowLeft } from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
  onAbout?: () => void;
  onGetStarted?: () => void;
}

export default function Navbar({
  showBack = false,
  onAbout,
  onGetStarted,
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-[#e0d9ce] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo — clicking logo also goes Home */}
        <button
          onClick={onGetStarted}
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
            onClick={onGetStarted}
            className="text-[#1a1a2e] text-sm hover:text-[#1a3a4a] transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Home
          </button>

          <button
            onClick={onAbout}
            className="text-[#1a1a2e] text-sm hover:text-[#1a3a4a] transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            About
          </button>

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