import { GraduationCap, Users, Clock, Building2 } from "lucide-react";

const scenarios = [
  {
    icon: GraduationCap,
    title: "Academic Keynote + Agent Co-presentation",
    badge: "Core scenario",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    steps: [
      "Human presenter shares paper, controls Slides",
      "Presenter says: \"My Agent has some supplementary analysis\"",
      "Agent joins via voice: \"I re-ran the experiments and found...\"",
      "Audience asks questions, Agent answers via RAG",
    ],
    value: "Human expert + Agent assistant creates a \"1+1>2\" presentation effect. Agent can staff Poster Sessions 24/7.",
  },
  {
    icon: Users,
    title: "Mixed Roundtable Discussion",
    badge: "Panel Discussion",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    steps: [
      "3 human experts + 2 Agents sit around a virtual table",
      "Human A presents an argument",
      "Agent B (powered by Codex) refutes via voice: \"I disagree, because in the code...\"",
      "Agent C (custom model) adds: \"I have a data point to add...\"",
      "Human D summarizes",
    ],
    value: "Agents provide diverse perspectives based on different knowledge bases. Discussions aren't limited by human availability.",
  },
  {
    icon: Clock,
    title: "24-Hour Poster Session",
    badge: "Global timezone coverage",
    badgeColor: "bg-teal-50 text-teal-600 border-teal-200",
    steps: [
      "Human authors upload papers, generate Agent avatars (paper content + voice clone)",
      "Visitors enter the virtual hall anytime, talk to the Agent",
      "Agent answers technical details, flags out-of-scope questions to human authors",
      "Human authors come online, Agent hands over context",
    ],
    value: "Solves the \"author must be present\" time constraint. Global timezone differences are no longer a problem.",
  },
  {
    icon: Building2,
    title: "Internal Tech Sharing",
    badge: "Team Collaboration",
    badgeColor: "bg-green-50 text-green-600 border-green-200",
    steps: [
      "Engineer shares code architecture design",
      "Team's \"Code Review Agent\" (powered by Claude Code) listens in real-time",
      "Agent chimes in at the right moment: \"There's a potential race condition here...\"",
      "After the meeting, Agent auto-generates minutes + Action Items",
    ],
    value: "Agent becomes a \"permanent member\" of the team, participating in daily technical discussions.",
  },
];

export default function ScenariosSection() {
  return (
    <section id="scenarios" className="section-padding bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm text-orange-600 font-medium mb-3">Scenarios</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            Four <span className="text-gradient">use cases.</span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            From academic conferences to internal team sharing, AgoraX lets Agents participate as equals in any meeting.
          </p>
        </div>

        {/* Scenarios */}
        <div className="grid md:grid-cols-2 gap-5">
          {scenarios.map((s) => (
            <div key={s.title} className="clean-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5 text-stone-600" />
                </div>
                <div>
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.badgeColor} mb-1`}>
                    {s.badge}
                  </span>
                  <h3 className="font-semibold text-stone-900 text-sm">{s.title}</h3>
                </div>
              </div>

              <ol className="space-y-2 mb-4">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-stone-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-[10px] font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                <p className="text-xs text-orange-700 leading-relaxed">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
