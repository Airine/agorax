import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Search } from "lucide-react";

const navLinks = [
  { label: "Docs", href: "#comparison" },
  { label: "Blog", href: "#scenarios" },
  { label: "Showcase", href: "#access" },
  { label: "Sponsors", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#fafaf8]/90 backdrop-blur-md border-b border-stone-200/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-stone-800">
              Agora<span className="text-orange-500">X</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors rounded-md hover:bg-stone-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 bg-stone-100/80 rounded-md hover:bg-stone-200/80 transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-stone-200">
                Ctrl K
              </kbd>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <Button
              size="sm"
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-stone-100 text-stone-500"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-stone-200">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
