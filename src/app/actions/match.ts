"use server";

import { scoreStartupInvestorPair } from "@/lib/matching";
import { calculateChatAIMatch } from "@/lib/ai";
import type { StartupProfile, InvestorProfile } from "@/lib/types";

export async function calculateMatchScore(
  startup: StartupProfile,
  investor: InvestorProfile
): Promise<{ score: number; reason: string }> {
  // 1. Calculate purely rule-based score
  const ruleResult = scoreStartupInvestorPair(startup, investor);
  const ruleScore = ruleResult.score;
  let finalScore = ruleScore;
  let finalReason = ruleResult.reasons[0]?.detail || "Matched based on sector and stage profile.";

  try {
    // 2. Obtain AI score from Gemini using existing chat match
    const aiResult = await calculateChatAIMatch(startup, investor);
    
    // 3. Combine scores: 0.6 rule + 0.4 ai
    finalScore = 0.6 * ruleScore + 0.4 * aiResult.score;
    finalReason = aiResult.rationale || finalReason;
  } catch (error) {
    console.error("Failed to generate AI score for match, falling back to rule score solely.", error);
    // Fallback: finalScore remains equal to ruleScore
  }

  return {
    score: Math.round(finalScore),
    reason: finalReason
  };
}
