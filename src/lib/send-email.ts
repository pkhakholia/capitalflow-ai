import type { InvestorProfile, StartupProfile } from "./types";

export type StructuredEmailFormData = {
  tractionMetrics: string;
  tractionStage: "Idea" | "MVP" | "Early Revenue" | "Scaling";
  sector: string;
  startupStage: string;
  fundingAsk: string;
  monthlyRevenue: string;
  productSummary: string;
};

type SendResult = { success: boolean; data?: unknown; error?: string };

export async function handleSendEmail(
  investor: InvestorProfile,
  startup: StartupProfile,
  formData: StructuredEmailFormData
): Promise<SendResult> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: investor.contactEmail,
        investorFirmName: investor.firmName,
        startupName: startup.companyName,
        startupEmail: startup.contactEmail,
        tractionMetrics: formData.tractionMetrics,
        tractionStage: formData.tractionStage,
        sector: formData.sector,
        startupStage: formData.startupStage,
        fundingAsk: formData.fundingAsk,
        monthlyRevenue: formData.monthlyRevenue,
        productSummary: formData.productSummary
      })
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
      return { success: false, error: body.error || "Failed to send email, server rejected request." };
    }

    return { success: true, data: body.data };
  } catch {
    return { success: false, error: "Network error occurred while sending this email." };
  }
}
