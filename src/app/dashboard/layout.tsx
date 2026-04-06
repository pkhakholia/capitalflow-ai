"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link className={buttonClasses({ variant: "ghost" })} href="/">
              Home
            </Link>
            <Link className={buttonClasses({ variant: "secondary" })} href="/startup">
              Startup Profile
            </Link>
            <Link className={buttonClasses({ variant: "secondary" })} href="/founder-profile">
              Founder Profile
            </Link>
          </div>
        </Container>
      </header>

      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
