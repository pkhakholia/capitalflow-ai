import Image from "next/image";
import Link from "next/link";

import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  href?: string;
  withLink?: boolean;
  priority?: boolean;
};

export function Logo({
  className,
  variant = "light",
  href = "/",
  withLink = true,
  priority = false
}: LogoProps) {
  const src = variant === "dark" ? BRAND.logoDark : BRAND.logoLight;

  const logoImage = (
    <Image
      src={src}
      alt={`${BRAND.name} logo`}
      width={240}
      height={64}
      priority={priority}
      className={cn("h-auto w-[150px] sm:w-[190px]", className)}
    />
  );

  if (!withLink) return logoImage;

  return (
    <Link href={href} className="inline-flex items-center">
      {logoImage}
    </Link>
  );
}

