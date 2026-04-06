"use client";

import { plans, featureLabels, type PlanFeatures } from "@/lib/pricing";

interface PricingTableProps {
  isYearly: boolean;
  currentPlan?: string;
}

function renderFeatureValue(value: string): React.ReactNode {
  if (value === "Yes") {
    return (
      <svg className="mx-auto h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (value === "-") {
    return <span className="text-slate-400">—</span>;
  }
  return <span className="text-sm text-slate-700">{value}</span>;
}

export function PricingTable({ isYearly, currentPlan = "free" }: PricingTableProps) {
  const featureKeys = Object.keys(featureLabels) as (keyof PlanFeatures)[];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-4 pr-4 text-left text-sm font-semibold text-slate-900">
              Feature
            </th>
            {plans.map((plan) => (
              <th
                key={plan.name}
                className={`px-4 py-4 text-center text-sm font-semibold ${
                  plan.mostPopular ? "text-[#4F46E5]" : "text-slate-900"
                }`}
              >
                {plan.name}
                {plan.mostPopular && (
                  <span className="ml-2 rounded-full bg-[#4F46E5]/10 px-2 py-0.5 text-xs text-[#4F46E5]">
                    Popular
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureKeys.map((key, index) => (
            <tr
              key={key}
              className={`border-b border-slate-100 ${
                index % 2 === 1 ? "bg-slate-50/50" : ""
              }`}
            >
              <td className="py-4 pr-4 text-sm font-medium text-slate-700">
                {featureLabels[key]}
              </td>
              {plans.map((plan) => (
                <td
                  key={`${plan.name}-${key}`}
                  className="px-4 py-4 text-center"
                >
                  {renderFeatureValue(plan.features[key])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <td className="py-4 pr-4 text-sm font-medium text-slate-700">
              Price
            </td>
            {plans.map((plan) => (
              <td
                key={`${plan.name}-price`}
                className="px-4 py-4 text-center"
              >
                <span className="text-sm font-semibold text-slate-900">
                  ₹{(isYearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">
                  {isYearly ? "/year" : "/month"}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
