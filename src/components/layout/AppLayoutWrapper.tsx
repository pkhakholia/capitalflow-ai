"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Public marketing pages should bypass the app sidebar layout.
  if (
    pathname === "/" ||
    pathname.startsWith("/tools/")
  ) {
    return (
      <main className="min-h-screen overflow-x-hidden">
        {children}
      </main>
    );
  }

  // Otherwise, wrap the standard application layout structure
  return (
    <div className="flex min-h-screen flex-col bg-[var(--vm-surface)] lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
