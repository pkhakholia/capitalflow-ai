"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText, User, Shield, Menu, X } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const platformLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Matches", href: "/dashboard/matches", icon: Users, badge: "3" },
    { name: "Investors", href: "/investors", icon: Users },
    { name: "Pitch Builder", href: "/pitch-builder", icon: FileText },
    { name: "Investor View", href: "/investor", icon: Shield }
  ];

  const profileLinks = [
    { name: "Startup Profile", href: "/startup", icon: User }
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const renderLinks = (
    links: Array<{ name: string; href: string; icon: React.ComponentType<{ size?: number }>; badge?: string }>,
    label: string
  ) => (
    <div>
      <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--vm-slate-4)]">
        {label}
      </div>
      <div className="flex flex-col gap-1">
        {links.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[13.5px] transition-colors",
                active
                  ? "bg-[var(--vm-indigo-light)] font-medium text-[var(--vm-indigo)]"
                  : "text-[var(--vm-slate-2)] hover:bg-[var(--vm-slate-6)] hover:text-[var(--vm-slate)]"
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.badge ? (
                <span className="ml-auto rounded-full bg-[var(--vm-indigo)] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--vm-slate-5)] bg-white px-4 lg:hidden">
        <Logo className="w-[140px]" />
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--vm-slate-5)] text-[var(--vm-slate)] transition hover:bg-[var(--vm-slate-6)]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(85vw,18rem)] flex-col border-r border-[var(--vm-slate-5)] bg-[var(--vm-white)] shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:min-h-screen lg:w-60 lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="border-b px-4 py-4">
          <Logo className="w-[150px]" />
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
          {renderLinks(platformLinks, "Platform")}
          {renderLinks(profileLinks, "Profile")}
        </nav>
      </aside>
    </>
  );
}
