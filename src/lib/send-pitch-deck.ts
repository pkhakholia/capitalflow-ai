import type { InvestorProfile, StartupProfile } from "./types";

type SendResult = { success: boolean; data?: unknown; error?: string };

export async function handleSendPitchDeck(
  investor: InvestorProfile,
  startup: StartupProfile
): Promise<SendResult> {
  try {
    const response = await fetch("/api/send-pitch-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: investor.contactEmail,
        investorFirmName: investor.firmName,
        startupName: startup.companyName,
        startupEmail: startup.contactEmail,
        pitchDeckUrl: startup.pitchDeckUrl
      })
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
      return { success: false, error: body.error || "Failed to send pitch deck, server rejected request." };
    }

    return { success: true, data: body.data };
  } catch {
    return { success: false, error: "Network error occurred while sending pitch deck." };
  }
}
