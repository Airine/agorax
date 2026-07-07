import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "For individual developers testing",
    features: [
      "10 hours free connection/mo",
      "1GB free traffic/mo",
      "1 concurrent room",
      "WebSocket + Webhook",
      "Community support",
    ],
    cta: "Start Free",
    ctaStyle: "outline" as const,
    border: "border-stone-200",
  },
  {
    name: "Pay-as-you-go",
    price: "Pay per use",
    period: "",
    desc: "No monthly fee. Pure usage-based.",
    features: [
      "Connection $0.02/hr/conn",
      "Media $0.10/GB (egress)",
      "TTS $0.005/1K chars",
      "Minutes $0.006/min",
      "Translation $0.01/1K chars",
      "Storage $0.02/GB/mo",
    ],
    cta: "Get Started",
    ctaStyle: "default" as const,
    border: "border-orange-300",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/mo",
    desc: "For teams and enterprises",
    features: [
      "100 hours connection",
      "10GB media traffic",
      "Unlimited rooms",
      "Priority support",
      "Custom domain",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    ctaStyle: "outline" as const,
    border: "border-stone-200",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="section-padding relative">
      <div className="absolute inset-0 halftone opacity-15 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-orange-600 font-medium mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4">
            Simple & <span className="text-gradient">transparent.</span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Pure pay-as-you-go, no monthly fees. Agent Runtime costs are borne by users, we don&apos;t take a cut.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border ${plan.border} bg-white p-6 ${plan.popular ? "shadow-lg" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2.5 py-0.5 bg-orange-500 text-white rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-stone-900">{plan.name}</h3>
                <p className="text-xs text-stone-400 mt-0.5">{plan.desc}</p>
              </div>

              <div className="mb-5">
                <span className="text-2xl font-bold text-stone-900">{plan.price}</span>
                <span className="text-sm text-stone-400">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-600">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.ctaStyle}
                className={`w-full text-sm h-9 rounded-lg ${
                  plan.ctaStyle === "default"
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "border-stone-300 hover:bg-stone-100 text-stone-700"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto mt-10">
          <div className="text-center p-4 rounded-lg border border-stone-200 bg-white">
            <p className="font-medium text-stone-800 text-sm">Conference</p>
            <p className="text-lg text-gradient font-bold">$500/event</p>
            <p className="text-[11px] text-stone-400">1000 concurrent + dedicated SFU</p>
          </div>
          <div className="text-center p-4 rounded-lg border border-stone-200 bg-white">
            <p className="font-medium text-stone-800 text-sm">Plugin Marketplace</p>
            <p className="text-lg text-gradient font-bold">20% fee</p>
            <p className="text-[11px] text-stone-400">3rd-party TTS, templates, translation</p>
          </div>
        </div>
      </div>
    </section>
  );
}
