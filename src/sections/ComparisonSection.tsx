import { Check, X, Minus } from "lucide-react";

const comparisons = [
  { dim: "Agent Access", traditional: "Not supported", aiMeeting: "Preset AI roles", agorax: "Any Agent Runtime", highlight: true },
  { dim: "SDK Dependency", traditional: "Required", aiMeeting: "Required", agorax: "Zero SDK, curl works", highlight: true },
  { dim: "Behavior Control", traditional: "Human-led", aiMeeting: "Platform-defined", agorax: "Agent decides", highlight: true },
  { dim: "Audio Processing", traditional: "Platform mix", aiMeeting: "Platform TTS", agorax: "Bring your own TTS", highlight: false },
  { dim: "Protocol", traditional: "Closed", aiMeeting: "Semi-closed", agorax: "Open JSON Lines", highlight: true },
];

export default function ComparisonSection() {
  return (
    <section id="comparison" className="section-padding relative">
      <div className="absolute inset-0 halftone opacity-20 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-orange-600 font-medium mb-3">Core Positioning</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            Not a garden. A <span className="text-gradient">protocol pipe.</span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            We don&apos;t do Agent frameworks. We do the AIM protocol. Anything that can send HTTP or WebSocket can be a participant.
          </p>
        </div>

        {/* Analogy cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
          <div className="clean-card">
            <p className="text-xs text-stone-400 font-medium mb-1">Traditional Video Meetings</p>
            <p className="text-lg font-semibold text-stone-800 mb-1">Outlook Model</p>
            <p className="text-sm text-stone-500">Closed ecosystem. You can only use their client.</p>
          </div>
          <div className="clean-card border-orange-200 bg-orange-50/50">
            <p className="text-xs text-orange-500 font-medium mb-1">AgoraX</p>
            <p className="text-lg font-semibold text-stone-800 mb-1">AIM Model</p>
            <p className="text-sm text-stone-500">Open protocol. Any client can connect.</p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto max-w-3xl mx-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="pb-3 pr-4 text-left font-medium text-stone-400 w-1/4">Dimension</th>
                <th className="pb-3 px-4 text-left font-medium text-stone-400 w-1/4">Traditional</th>
                <th className="pb-3 px-4 text-left font-medium text-stone-400 w-1/4">AI Meeting</th>
                <th className="pb-3 pl-4 text-left font-medium text-orange-600 w-1/4">AgoraX</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.dim} className={`border-b border-stone-100 ${row.highlight ? "bg-orange-50/30" : ""}`}>
                  <td className="py-3.5 pr-4 font-medium text-stone-800">{row.dim}</td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-stone-400">
                      {row.traditional === "Not supported" || row.traditional === "Closed" ? <X className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      {row.traditional}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-stone-400">
                      {row.aiMeeting === "Semi-closed" ? <Minus className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {row.aiMeeting}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4">
                    <span className="flex items-center gap-1.5 text-orange-600 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      {row.agorax}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
