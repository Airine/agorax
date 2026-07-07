import { Rocket, Target, TrendingUp, Globe, CheckCircle2, Circle, Clock } from "lucide-react";

const phases = [
  {
    id: "mvp",
    title: "MVP",
    time: "6 wks",
    icon: Rocket,
    color: "text-emerald-600",
    goal: "Support 2 people (1 human + 1 Agent) voice chat",
    status: "In Progress",
    items: [
      { text: "WebSocket protocol pipe (JOIN/SPEAK/LEAVE)", done: true },
      { text: "1 SFU node (mediasoup)", done: true },
      { text: "CLI tool (conf join / conf agent)", done: false },
      { text: "Basic Web UI (for humans)", done: false },
      { text: "DID + API Key identity system", done: false },
      { text: "Docs + access examples", done: false },
    ],
  },
  {
    id: "v1",
    title: "V1",
    time: "+6 wks",
    icon: Target,
    color: "text-blue-600",
    goal: "Support 10-person roundtable, all 4 access methods",
    status: "Planned",
    items: [
      { text: "Room state machine (hand queue, speak token)", done: false },
      { text: "Slides sync (Yjs CRDT)", done: false },
      { text: "SSE access method", done: false },
      { text: "Full Web UI", done: false },
      { text: "Multi-room support", done: false },
      { text: "Recording", done: false },
    ],
  },
  {
    id: "v2",
    title: "V2",
    time: "+8 wks",
    icon: TrendingUp,
    color: "text-purple-600",
    goal: "Support 100-person Keynote, multi-language interpretation",
    status: "Planned",
    items: [
      { text: "TTS cloud (MiniMax, Doubao)", done: false },
      { text: "Live minutes (Whisper + LLM)", done: false },
      { text: "Live translation (voice-to-voice)", done: false },
      { text: "Virtual hall (2D canvas)", done: false },
      { text: "Plugin system", done: false },
    ],
  },
  {
    id: "v3",
    title: "V3",
    time: "+12 wks",
    icon: Globe,
    color: "text-cyan-600",
    goal: "Support 1000-person conference, protocol becomes standard",
    status: "Planned",
    items: [
      { text: "Edge SFU nodes (global deploy)", done: false },
      { text: "SFU cascading (large rooms)", done: false },
      { text: "Open protocol docs + community SDK", done: false },
      { text: "Plugin marketplace", done: false },
      { text: "Enterprise / Conference pricing", done: false },
    ],
  },
];

const milestones = [
  { time: "6mo", rooms: "50", concur: "5", rev: "$360" },
  { time: "12mo", rooms: "500", concur: "10", rev: "$7,200" },
  { time: "18mo", rooms: "5,000", concur: "15", rev: "$108,000" },
  { time: "24mo", rooms: "50,000", concur: "20", rev: "$1,440,000" },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="section-padding bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm text-orange-600 font-medium mb-3">Roadmap</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            From 2 people to <span className="text-gradient">1,000.</span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Protocol is the product. From voice chat to global conferences.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-stone-200" />

          <div className="space-y-10">
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative grid lg:grid-cols-2 gap-6 items-start">
                {/* Center dot */}
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-stone-200 items-center justify-center z-10">
                  <phase.icon className={`w-3.5 h-3.5 ${phase.color}`} />
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? "lg:order-2 lg:pl-12" : "lg:pr-12"}>
                  <div className="clean-card">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-stone-900">{phase.title}</h3>
                      <span className="text-xs text-stone-400">{phase.time}</span>
                      <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        phase.status === "In Progress"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200"
                      }`}>
                        {phase.status === "In Progress" && <Clock className="w-3 h-3 inline mr-1" />}
                        {phase.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-4 font-medium">Goal: {phase.goal}</p>
                    <ul className="space-y-1.5">
                      {phase.items.map((item) => (
                        <li key={item.text} className="flex items-center gap-2 text-sm">
                          {item.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
                          )}
                          <span className={item.done ? "text-stone-700" : "text-stone-400"}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spacer */}
                <div className={index % 2 === 1 ? "lg:order-1" : "hidden lg:block"} />
              </div>
            ))}
          </div>
        </div>

        {/* Revenue projection */}
        <div className="mt-16">
          <h3 className="text-sm font-semibold text-stone-800 text-center mb-6">Revenue Projection (Conservative)</h3>
          <div className="overflow-x-auto max-w-2xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-2 pr-4 text-left font-medium text-stone-400 text-xs">Phase</th>
                  <th className="pb-2 px-4 text-left font-medium text-stone-400 text-xs">Rooms/mo</th>
                  <th className="pb-2 px-4 text-left font-medium text-stone-400 text-xs">Avg Concurrent</th>
                  <th className="pb-2 pl-4 text-left font-medium text-orange-600 text-xs">Monthly Revenue</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.time} className="border-b border-stone-100">
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{m.time}</td>
                    <td className="py-2.5 px-4 text-stone-500">{m.rooms}</td>
                    <td className="py-2.5 px-4 text-stone-500">{m.concur}</td>
                    <td className="py-2.5 pl-4 text-emerald-600 font-mono text-sm">{m.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
