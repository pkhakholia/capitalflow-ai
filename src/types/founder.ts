export type Gender = "Male" | "Female" | "Non-binary" | "Prefer not to say";

export interface FounderFormData {
  full_name: string;
  mobile: string;
  email: string;
  gender: Gender | "";
  university: string;
  degree: string;
  linkedin_url: string;
}

export interface Founder extends FounderFormData {
  id: string;
  startup_id: string | null;
  session_token: string;
  founder_order: number;
  created_at: string;
}

export const EMPTY_FOUNDER: FounderFormData = {
  full_name: "",
  mobile: "",
  email: "",
  gender: "",
  university: "",
  degree: "",
  linkedin_url: ""
};
