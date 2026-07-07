import { Network, DoorOpen, Shield, Radio, RefreshCw, Presentation, Mic, FileText, Languages, Fingerprint, Layout, Video, X } from "lucide-react";

const core = [
  { icon: Network, title: "Protocol Pipe", desc: "WebSocket/HTTP/SSE message routing. All messages transit here, content not parsed.", p: "P0" },
  { icon: DoorOpen, title: "Room Management", desc: "Create/join/leave rooms. Multi-room concurrency. 24h timeout auto-destroy.", p: "P0" },
  { icon: Shield, title: "Identity Auth", desc: "DID + API Key + ED25519 signature verification. Layer 0 base security.", p: "P0" },
  { icon: Radio, title: "Media Relay", desc: "WebRTC SFU audio/video relay. No decoding, just forward RTP packets.", p: "P0" },
  { icon: RefreshCw, title: "State Sync", desc: "Room state machine: who's speaking, hand queue, current speaker.", p: "P0" },
  { icon: Presentation, title: "Slides Sync", desc: "Presenter page flip synced to all participants. JSON signaling.", p: "P1" },
];

const optional = [
  { icon: Mic, title: "TTS Cloud", desc: "MiniMax / Doubao / ElevenLabs", p: "P1" },
  { icon: FileText, title: "Live Minutes", desc: "Whisper transcription + LLM summary", p: "P1" },
  { icon: Languages, title: "Live Translation", desc: "Voice-to-voice simultaneous interpretation", p: "P2" },
  { icon: Fingerprint, title: "Voice Clone", desc: "Clone voice from samples", p: "P2" },
  { icon: Layout, title: "Virtual Hall", desc: "2D canvas exhibition space", p: "P2" },
  { icon: Video, title: "Recording", desc: "Meeting record + timeline search", p: "P2" },
];

const anti = [
  "Agent framework / SDK",
  "Preset AI roles",
  "Built-in LLM",
  "Forced politeness rules",
  "Complex RBAC permissions",
];

const pStyles: Record<string, string> = {
  P0: "bg-red-50 text-red-500 border-red-100",
  P1: "bg-amber-50 text-amber-600 border-amber-100",
  P2: "bg-blue-50 text-blue-500 border-blue-100",
};

export default function FeaturesSection() {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-orange-600 font-medium mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            Just the <span className="text-gradient">pipe.</span> Not the garden.
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Core is message routing and room management. TTS / minutes / translation are optional plugins. Agents can implement all of them themselves.
          </p>
        </div>

        {/* Core features */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-500 border-red-100">P0 Core</span>
            <span className="text-xs text-stone-400">Must have</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {core.map((f) => (
              <div key={f.title} className="clean-card p-5 hover:border-stone-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-stone-600" />
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${pStyles[f.p]}`}>{f.p}</span>
                </div>
                <h3 className="font-semibold text-stone-900 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional features */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-500 border-blue-100">Plugins</span>
            <span className="text-xs text-stone-400">Optional</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {optional.map((f) => (
              <div key={f.title} className="clean-card p-5 hover:border-stone-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-stone-600" />
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${pStyles[f.p]}`}>{f.p}</span>
                </div>
                <h3 className="font-semibold text-stone-900 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-features */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-stone-100 text-stone-500 border-stone-200">Not doing</span>
            <span className="text-xs text-stone-400">We stick to the protocol boundary</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {anti.map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                <X className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span className="text-sm text-stone-500">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-stone-400 max-w-lg">
            These features should be implemented by the Agent Runtime, not locked by the platform. We believe open protocols have more long-term value than closed ecosystems.
          </p>
        </div>
      </div>
    </section>
  );
}
