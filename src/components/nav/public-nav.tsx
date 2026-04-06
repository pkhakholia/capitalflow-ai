import Link from "next/link";

import { Logo } from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-mutedForeground md:flex">
          <Link className="hover:text-foreground" href="/#how-it-works">
            How it works
          </Link>
          <Link className="hover:text-foreground" href="/#features">
            Features
          </Link>
          <Link className="hover:text-foreground" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-foreground" href="/pitch-builder">
            Pitch Builder
          </Link>
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
        </div>
      </Container>
    </header>
  );
}

