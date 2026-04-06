import { supabase } from "@/lib/supabase";
import type { InvestorOutreach, InvestorOutreachInsert, InvestorOutreachUpdate, OutreachStage } from "@/types/outreach";

export async function fetchInvestorOutreach(startupId: string): Promise<InvestorOutreach[]> {
  try {
    // First try a simple query without the join to check if table exists
    const { error: tableCheckError } = await supabase
      .from("investor_outreach")
      .select("id")
      .limit(1);

    // If table doesn't exist or there's a permission error, return empty array
    if (tableCheckError) {
      console.warn("investor_outreach table not accessible:", tableCheckError.message);
      return [];
    }

    // Table exists, proceed with full query
    const { data, error } = await supabase
      .from("investor_outreach")
      .select(`
        *,
        investors:investor_id (fund_name, ticket_min, ticket_max)
      `)
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching investor outreach:", error.message);
      return [];
    }

    return (data || []).map((item: Record<string, unknown>) => ({
      id: String(item.id),
      investor_id: String(item.investor_id),
      startup_id: String(item.startup_id),
      outreach_stage: String(item.outreach_stage) as OutreachStage,
      date_contacted: item.date_contacted ? String(item.date_contacted) : undefined,
      created_at: String(item.created_at),
      updated_at: String(item.updated_at),
      fund_name: item.investors && typeof item.investors === "object" && !Array.isArray(item.investors)
        ? String((item.investors as Record<string, unknown>).fund_name || "")
        : undefined,
      ticket_min: item.investors && typeof item.investors === "object" && !Array.isArray(item.investors)
        ? Number((item.investors as Record<string, unknown>).ticket_min) || undefined
        : undefined,
      ticket_max: item.investors && typeof item.investors === "object" && !Array.isArray(item.investors)
        ? Number((item.investors as Record<string, unknown>).ticket_max) || undefined
        : undefined
    }));
  } catch (e) {
    console.error("Unexpected error fetching investor outreach:", e);
    return [];
  }
}

export async function addInvestorOutreach(
  outreach: InvestorOutreachInsert
): Promise<{ success: boolean; data?: InvestorOutreach; error?: string }> {
  const { data, error } = await supabase
    .from("investor_outreach")
    .insert({
      investor_id: outreach.investor_id,
      startup_id: outreach.startup_id,
      outreach_stage: outreach.outreach_stage,
      date_contacted: outreach.date_contacted || new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding investor outreach:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as unknown as InvestorOutreach
  };
}

export async function updateInvestorOutreachStage(
  outreachId: string,
  stage: OutreachStage
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("investor_outreach")
    .update({
      outreach_stage: stage,
      updated_at: new Date().toISOString()
    })
    .eq("id", outreachId);

  if (error) {
    console.error("Error updating investor outreach stage:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateInvestorOutreach(
  outreachId: string,
  updates: InvestorOutreachUpdate
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("investor_outreach")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", outreachId);

  if (error) {
    console.error("Error updating investor outreach:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkInvestorOutreachExists(
  investorId: string,
  startupId: string
): Promise<InvestorOutreach | null> {
  const { data, error } = await supabase
    .from("investor_outreach")
    .select("*")
    .eq("investor_id", investorId)
    .eq("startup_id", startupId)
    .maybeSingle();

  if (error) {
    console.error("Error checking investor outreach:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    investor_id: String(data.investor_id),
    startup_id: String(data.startup_id),
    outreach_stage: String(data.outreach_stage) as OutreachStage,
    date_contacted: data.date_contacted ? String(data.date_contacted) : undefined,
    created_at: String(data.created_at),
    updated_at: String(data.updated_at)
  };
}

export async function getOrCreateInvestorOutreach(
  investorId: string,
  startupId: string,
  initialStage: OutreachStage = "reached_out"
): Promise<{ success: boolean; data?: InvestorOutreach; error?: string }> {
  // Check if outreach already exists
  const existing = await checkInvestorOutreachExists(investorId, startupId);

  if (existing) {
    return { success: true, data: existing };
  }

  // Create new outreach entry
  return addInvestorOutreach({
    investor_id: investorId,
    startup_id: startupId,
    outreach_stage: initialStage,
    date_contacted: new Date().toISOString()
  });
}
