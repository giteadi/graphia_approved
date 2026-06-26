interface FooterProps {
  onRefund?: () => void;
}

export default function Footer({ onRefund }: FooterProps) {
  return (
    <footer className="bg-[#1a1a2e] text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#1a5c6b] rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div className="flex items-start">
                <span
                  className="text-white font-bold text-lg tracking-tight"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  GraphiaCheck
                  <sup className="text-[9px] font-sans font-bold not-italic ml-0.5 opacity-60 tracking-normal">TM</sup>
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "system-ui, sans-serif" }}>
              A clinical diagnostic tool for evaluating handwriting characteristics associated with dysgraphia.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-[#e07a3a] uppercase tracking-widest" style={{ fontFamily: "system-ui, sans-serif" }}>
              Legal
            </h3>
            <ul className="space-y-2">
              {onRefund && (
                <li>
                  <button
                    onClick={onRefund}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    Refund Policy
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-[#e07a3a] uppercase tracking-widest" style={{ fontFamily: "system-ui, sans-serif" }}>
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@graphiacheck.in" className="text-gray-400 text-sm hover:text-white transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
                  support@graphiacheck.in
                </a>
              </li>
              <li>
                <a href="https://graphiacheck.in" className="text-gray-400 text-sm hover:text-white transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
                  www.graphiacheck.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
            © {new Date().getFullYear()} GraphiaCheck. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}