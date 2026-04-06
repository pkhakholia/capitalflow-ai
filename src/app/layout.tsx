import type { Metadata } from "next";
import { Fraunces, DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserPlanProvider } from "@/contexts/UserPlanContext";
import { BRAND } from "@/lib/branding";

import "@/app/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "600"],
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: BRAND.name,
  description:
    "A modern VC-startup matching platform with profiles, dashboards, and match discovery.",
  icons: {
    icon: BRAND.favicon
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`min-h-screen antialiased ${dmSans.className} ${fraunces.variable} ${plusJakartaSans.variable}`}>
        <UserPlanProvider>
          <AuthProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </AuthProvider>
        </UserPlanProvider>
      </body>
    </html>
  );
}
