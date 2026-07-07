import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, Copy, Check, HelpCircle } from "lucide-react";

const typedTexts = [
  "WebSocket",
  "Webhook",
  "SSE",
  "CLI",
];

export default function HeroSection() {
  const [copied, setCopied] = useState(false);
  const [typedIndex, setTypedIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = typedTexts[typedIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayText(current.slice(0, displayText.length + 1));
          if (displayText.length + 1 === current.length) {
            setTimeout(() => setIsDeleting(true), 1500);
          }
        } else {
          setDisplayText(current.slice(0, displayText.length - 1));
          if (displayText.length - 1 === 0) {
            setIsDeleting(false);
            setTypedIndex((typedIndex + 1) % typedTexts.length);
          }
        }
      },
      isDeleting ? 80 : 120
    );
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, typedIndex]);

  const copyCmd = () => {
    navigator.clipboard.writeText("npx agorax-cli init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Halftone decoration - top right */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-40 pointer-events-none">
        <div className="absolute inset-0 halftone rounded-full" style={{
          background: "radial-gradient(circle at 70% 30%, rgba(217,119,6,0.15) 0%, transparent 60%)"
        }} />
      </div>

      {/* Dot pattern background */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Announcement badge */}
        <div className="flex justify-center mb-6">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
            </span>
            Protocol Router for Agent-Human Meetings
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {/* Main heading */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-stone-900">We don&apos;t build</span>{" "}
            <span className="text-gradient">Agents.</span>
            <br />
            <span className="text-stone-900">We build</span>{" "}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gradient cursor-help inline-flex items-center gap-1">
                    AIM.
                    <HelpCircle className="w-4 h-4 text-orange-400 opacity-60" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p className="font-medium mb-0.5">Agent-Inclusive Meeting</p>
                  <p className="text-muted-foreground">The open protocol that lets any Agent Runtime join human meetings — via voice, text, or anything in between.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className="text-base md:text-lg text-stone-500 leading-relaxed max-w-xl mx-auto">
            AgoraX is a real-time protocol pipe for agent-human meetings.
            Any Agent Runtime can join with a single command and talk to humans or other agents via voice or text.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Button
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm h-10 px-5 rounded-lg"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
          <Button
            variant="outline"
            className="border-stone-300 hover:bg-stone-100 text-stone-700 text-sm h-10 px-5 rounded-lg"
          >
            Open StackBlitz
          </Button>
        </div>

        {/* Terminal block */}
        <div className="max-w-2xl mx-auto">
          <div className="terminal-block">
            <div className="terminal-header">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-stone-600" />
                <div className="w-3 h-3 rounded-full bg-stone-600" />
                <div className="w-3 h-3 rounded-full bg-stone-600" />
              </div>
              <span className="text-xs text-stone-400 ml-2">Terminal</span>
              <button
                onClick={copyCmd}
                className="ml-auto text-stone-400 hover:text-stone-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="terminal-body text-stone-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-400">$</span>
                <span>npx agorax-cli init</span>
              </div>
              <div className="text-stone-400 mt-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">●</span>
                  <span>Detected lockfile, using <span className="text-orange-300">bun</span></span>
                </div>
                <div className="pl-4 text-stone-500">│</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">◇</span>
                  <span>Which transport do you want to use?</span>
                </div>
                <div className="pl-4 text-orange-300">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </div>
                <div className="pl-4 text-stone-500">│</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">◇</span>
                  <span>Which room do you want to join?</span>
                </div>
                <div className="pl-4 text-orange-300">ai-summit-2024</div>
                <div className="pl-4 text-stone-500">│</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">◆</span>
                  <span className="text-stone-500">Would you like to enable voice?</span>
                </div>
                <div className="pl-4 flex gap-2 text-stone-500">
                  <span className="text-stone-300">[◉] Voice</span>
                  <span>[◉] Text</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
