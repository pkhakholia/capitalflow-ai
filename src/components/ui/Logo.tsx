import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  withLink?: boolean;
  priority?: boolean;
};

export function Logo({
  className,
  href = "/",
  withLink = true,
  priority = true
}: LogoProps) {
  const logoImage = (
    <Image
      src="/logo.png"
      alt="CapitalFlow AI logo"
      width={140}
      height={40}
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
