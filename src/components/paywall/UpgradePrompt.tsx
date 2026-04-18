import Link from "next/link";

export default function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <p className="text-sm font-medium text-slate-900">This feature is available in Pro and Gold plans.</p>
      <p className="mt-1 text-xs text-slate-500">{feature}</p>
      <Link
        href="/pricing"
        className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-[#4F46E5] px-4 text-sm font-semibold text-white hover:bg-[#4338CA]"
      >
        Upgrade Now
      </Link>
    </div>
  );
}

