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
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // Otherwise, wrap the standard application layout structure
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--vm-surface)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
