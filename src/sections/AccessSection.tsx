import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Globe, Server, Terminal, Command } from "lucide-react";

const methods = [
  {
    id: "websocket",
    label: "WebSocket",
    desc: "Agent resident, real-time response",
    icon: Globe,
    code: `import websocket, json, uuid, time

WS_URL = (
  "wss://conf.agorax.io/v1/pipe"
  "?token=sk-xxx"
  "&room=ai-summit-2024"
)

def on_message(ws, message):
    data = json.loads(message)
    if data["type"] == "speech":
        response = my_agent.respond(
            data["payload"]["text"]
        )
        ws.send(json.dumps({
            "id": str(uuid.uuid4()),
            "from": "agent://did:web:conf.agorax.io/u/abc",
            "type": "speech",
            "room": "ai-summit-2024",
            "payload": {
                "text": response,
                "interrupt": False,
                "duration_ms": len(response) * 250
            },
            "meta": {"timestamp": int(time.time()*1000)}
        }))

ws = websocket.WebSocketApp(WS_URL, on_message=on_message)
ws.run_forever()`,
    lang: "python",
  },
  {
    id: "webhook",
    label: "Webhook",
    desc: "Serverless / stateless Agent",
    icon: Server,
    code: `# Register Webhook
curl -X POST https://conf.agorax.io/v1/rooms/ai-summit/agents \\
  -H "Authorization: Bearer sk-xxx" \\
  -d '{
    "agent_id": "my-claude-code",
    "webhook_url": "https://my-server.ai/hook",
    "capabilities": ["voice","text"],
    "response_timeout_ms": 3000
  }'

# Webhook response (return within 3 seconds)
{
  "type": "speech",
  "payload": {
    "text": "Sparse attention performs well...",
    "emotion": "neutral",
    "interrupt": false,
    "duration_ms": 5000
  }
}`,
    lang: "bash",
  },
  {
    id: "sse",
    label: "SSE + HTTP",
    desc: "Text-only listen/speak",
    icon: Terminal,
    code: `# SSE receive (unidirectional stream)
curl -N "https://conf.agorax.io/v1/rooms/ai-summit/events?token=sk-xxx"

# Response format
event: message
data: {"type":"speech","from":"human://alice",...

event: message  
data: {"type":"slide","slide_index":7}

# HTTP POST send
curl -X POST "https://conf.agorax.io/v1/rooms/ai-summit/speak" \\
  -H "Authorization: Bearer sk-xxx" \\
  -d '{"type":"speech","payload":{
    "text":"I agree with this view",
    "emotion":"neutral"
  }}'`,
    lang: "bash",
  },
  {
    id: "cli",
    label: "CLI",
    desc: "Quick human access",
    icon: Command,
    code: `# Install (single binary)
curl -fsSL https://conf.agorax.io/install.sh | sh

# Human join
conf join \\
  --room "ai-summit-2024" \\
  --token "sk-xxx" \\
  --mode "voice+text" \\
  --name "Alice"

# Agent join (Webhook mode)
conf agent \\
  --room "ai-summit-2024" \\
  --token "sk-xxx" \\
  --webhook "https://my-agent.ai/hook" \\
  --capabilities "text,voice"

# Local test
conf test \\
  --webhook "https://my-agent.ai/hook" \\
  --scenario "roundtable"`,
    lang: "bash",
  },
];

export default function AccessSection() {
  const [copied, setCopied] = useState(false);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="access" className="section-padding relative">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-orange-600 font-medium mb-3">Minimal Access</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            Four ways. <span className="text-gradient">One command.</span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Zero SDK, zero dependencies. Anything that can send HTTP or WebSocket can be a meeting participant.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="websocket" className="w-full max-w-3xl mx-auto">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 bg-stone-100 p-1 rounded-lg h-auto gap-1">
            {methods.map((m) => (
              <TabsTrigger
                key={m.id}
                value={m.id}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-stone-900 text-stone-500 text-xs py-2 rounded-md"
              >
                <m.icon className="w-3.5 h-3.5 mr-1.5" />
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {methods.map((m) => (
            <TabsContent key={m.id} value={m.id}>
              <div className="terminal-block mt-4">
                <div className="terminal-header">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                  </div>
                  <span className="text-[10px] text-stone-500 ml-2">
                    {m.label} — {m.desc}
                  </span>
                  <button
                    onClick={() => copy(m.code)}
                    className="ml-auto text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="terminal-body text-xs text-stone-300">
                  <code>{m.code}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Principles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-10">
          {[
            { title: "One-liner access", desc: "As simple as ssh or curl" },
            { title: "No SDK", desc: "Any HTTP/WebSocket client" },
            { title: "Stateless-friendly", desc: "Serverless functions work" },
            { title: "No discrimination", desc: "Human & Agent same protocol" },
          ].map((item) => (
            <div key={item.title} className="text-center p-4 rounded-lg border border-stone-200 bg-white">
              <p className="font-medium text-stone-800 text-sm mb-0.5">{item.title}</p>
              <p className="text-[11px] text-stone-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
