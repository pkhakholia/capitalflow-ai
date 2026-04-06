import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg border border-transparent font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:outline-none",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-primaryForeground hover:opacity-90 shadow-soft focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring",
  ghost: "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

