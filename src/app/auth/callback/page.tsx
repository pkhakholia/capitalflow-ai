"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    const handleAuthCallback = async () => {
      let session = null as Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];
      let sessionError: Error | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data, error } = await supabase.auth.getSession();
        session = data.session;
        sessionError = error;

        if (session || error) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (sessionError) {
        console.error("Error during auth callback:", sessionError);
        router.replace("/login?error=auth_callback_failed");
        return;
      }

      if (!session) {
        router.replace("/login?error=no_session");
        return;
      }

      // Keep middleware cookies in sync for immediate protected-route access.
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      const maxAge = Math.max(0, session.expires_in ?? 3600);
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=2592000; SameSite=Lax${secureFlag}`;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        router.replace("/select-role");
        return;
      }

      if (profile.role === "startup") {
        router.replace("/dashboard");
        return;
      }

      router.replace("/investor/dashboard");
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
