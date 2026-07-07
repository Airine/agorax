import { Github, Twitter } from "lucide-react";

const links = {
  Product: [
    { label: "Core Positioning", href: "#comparison" },
    { label: "Scenarios", href: "#scenarios" },
    { label: "Access Methods", href: "#access" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "#roadmap" },
  ],
  Developers: [
    { label: "Protocol Docs", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "SDK Examples", href: "#" },
    { label: "CLI Tool", href: "#" },
    { label: "Webhook Guide", href: "#" },
    { label: "Status", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Brand", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "SLA", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">A</span>
              </div>
              <span className="font-semibold text-sm text-stone-800">
                Agora<span className="text-orange-500">X</span>
              </span>
            </a>
            <p className="text-xs text-stone-400 mb-4 max-w-xs leading-relaxed">
              Real-time protocol pipe for agent-human meetings. We don&apos;t build Agents. We build AIM.
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors">
                <Github className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors">
                <Twitter className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <h4 className="font-medium text-xs text-stone-800 mb-3">{cat}</h4>
              <ul className="space-y-1.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-stone-400">
            &copy; 2026 AgoraX. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
