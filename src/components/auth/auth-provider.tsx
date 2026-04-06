"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useUserPlan } from "@/contexts/UserPlanContext";
import type { User, Profile, UserRole } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; needsProfile: boolean }>;
  signOut: () => Promise<void>;
  createProfile: (role: UserRole) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchUserPlan, clearUserPlan } = useUserPlan();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at
          };
          setUser(userData);
          await fetchProfile(session.user.id);
          // Fetch user plan for global state
          await fetchUserPlan(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at
        };
        setUser(userData);
        await fetchProfile(session.user.id);
        // Fetch user plan on sign in
        await fetchUserPlan(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        clearUserPlan();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserPlan, clearUserPlan]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("No profile found for user:", userId);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email"
    });

    if (error) {
      return { error, needsProfile: false };
    }

    if (data.user) {
      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at
      };
      setUser(userData);

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profileData) {
        return { error: null, needsProfile: true };
      }

      setProfile(profileData);
      return { error: null, needsProfile: false };
    }

    return { error: null, needsProfile: false };
  };

  const createProfile = async (role: UserRole) => {
    if (!user) {
      return { error: new Error("No user logged in") };
    }

    try {
      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role
        });

      if (profileError) {
        return { error: new Error(profileError.message) };
      }

      // Link to appropriate table based on role
      if (role === "startup") {
        // Check if startup already exists with this user_id
        const { data: existingStartup } = await supabase
          .from("Startups")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingStartup) {
          await supabase.from("Startups").insert({
            user_id: user.id,
            startup_name: null
          });
        }
      } else if (role === "investor") {
        // Check if investor already exists with this user_id
        const { data: existingInvestor } = await supabase
          .from("investors")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingInvestor) {
          await supabase.from("investors").insert({
            user_id: user.id,
            fund_name: null
          });
        }
      }

      // Fetch and set the new profile
      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Failed to create profile") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signInWithOtp,
        verifyOtp,
        signOut,
        createProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
