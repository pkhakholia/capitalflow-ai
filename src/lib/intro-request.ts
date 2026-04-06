import { supabase } from "./supabase";

export async function createIntroRequest(
  startup_id: string,
  investor_id: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("intro_requests")
      .insert([
        {
          startup_id,
          investor_id,
          message,
          status: "pending",
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to create intro request:", err);
    return { success: false, error: "Network or unexpected error while creating request." };
  }
}
