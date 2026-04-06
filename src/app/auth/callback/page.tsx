"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the hash fragment from the URL
      const hash = window.location.hash;
      
      if (hash) {
        // Supabase will automatically handle the token exchange
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error during auth callback:", error);
          router.push("/login?error=auth_callback_failed");
          return;
        }

        if (data.session) {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.session.user.id)
            .single();

          if (profile) {
            // User has profile, redirect to appropriate dashboard
            if (profile.role === "startup") {
              router.push("/dashboard");
            } else {
              router.push("/investor/dashboard");
            }
          } else {
            // User needs to select role
            router.push("/select-role");
          }
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#4F46E5] mx-auto mb-4" size={32} />
        <p className="text-[#64748B]">Completing sign in...</p>
      </div>
    </div>
  );
}
