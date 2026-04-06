"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User, Profile } from "@/types/auth";

interface UseAuthReturn {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Client-side auth hook for protected pages
 * Automatically redirects to /login if user is not authenticated
 */
export function useAuth(requireAuth: boolean = true): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // No session found
          if (requireAuth) {
            router.push("/login");
          }
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // User is authenticated
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        };
        setUser(userData);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profileData) {
          // No profile - redirect to role selection
          setProfile(null);
          if (requireAuth) {
            router.push("/select-role");
          }
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (requireAuth) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          if (requireAuth) {
            router.push("/login");
          }
        } else if (event === "SIGNED_IN" && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at,
          };
          setUser(userData);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, requireAuth]);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  };
}

/**
 * Hook for role-based authorization
 * Redirects if user doesn't have the required role
 */
export function useRequireRole(
  allowedRoles: ("startup" | "investor")[]
): UseAuthReturn {
  const auth = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.profile) {
      if (!allowedRoles.includes(auth.profile.role)) {
        // Redirect to correct dashboard
        if (auth.profile.role === "startup") {
          router.push("/dashboard");
        } else {
          router.push("/investor/dashboard");
        }
      }
    }
  }, [auth.isLoading, auth.profile, router, allowedRoles]);

  return auth;
}
