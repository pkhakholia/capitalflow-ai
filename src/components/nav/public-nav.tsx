"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const [open, setOpen] = React.useState(false);
  const navLinks = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#features", label: "Features" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pitch-builder", label: "Pitch Builder" }
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-mutedForeground md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} className="hover:text-foreground" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            className={buttonClasses({
              variant: "ghost",
              className: "hidden sm:inline-flex"
            })}
            href="/investor-signup"
          >
            Investor
          </Link>
          <Link className={buttonClasses({ variant: "primary" })} href="/founder-profile">
            Startup
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      <div
        className={cn(
          "overflow-hidden border-t bg-background transition-[max-height,opacity] duration-200 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Container className="flex flex-col gap-2 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className="rounded-lg px-2 py-3 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className={buttonClasses({ variant: "ghost", className: "justify-center" })}
            href="/investor-signup"
            onClick={() => setOpen(false)}
          >
            Investor
          </Link>
        </Container>
      </div>
    </header>
  );
}
