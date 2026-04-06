export type UserRole = "startup" | "investor";

export interface Profile {
  id: string;
  role: UserRole;
  plan?: "free" | "pro" | "gold";
  subscription_status?: "active" | "inactive" | "cancelled" | null;
  subscription_end?: string | null;
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
