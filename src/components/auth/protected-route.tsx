"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("startup" | "investor")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!profile) {
        router.push("/select-role");
      } else if (allowedRoles && !allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard if role doesn't match
        if (profile.role === "startup") {
          router.push("/dashboard");
        } else {
          router.push("/investor/dashboard");
        }
      }
    }
  }, [user, profile, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
