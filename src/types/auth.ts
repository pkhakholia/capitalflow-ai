export type UserRole = "startup" | "investor";

export interface Profile {
  id: string;
  role: UserRole;
  plan?: "free" | "pro" | "gold";
  subscription_status?: "active" | "cancelled" | "inactive" | null;
  subscription_id?: string | null;
  razorpay_payment_id?: string | null;
  plan_activated_at?: string | null;
  plan_expires_at?: string | null;
  next_billing_at?: string | null;
  subscription_end?: string | null;
  outreach_count?: number | null;
  last_reset?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
