"use client";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
}

export function PricingToggle({ isYearly, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onToggle(false)}
        className={`text-sm font-medium transition-colors ${
          !isYearly ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Monthly
      </button>

      <button
        onClick={() => onToggle(!isYearly)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          isYearly ? "bg-[#4F46E5]" : "bg-slate-200"
        }`}
        aria-label="Toggle yearly billing"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            isYearly ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(true)}
          className={`text-sm font-medium transition-colors ${
            isYearly ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Yearly
        </button>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          25% OFF
        </span>
      </div>
    </div>
  );
}
