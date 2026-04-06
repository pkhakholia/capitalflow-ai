import { z } from "zod";

import {
  InvestorProfileInputSchema,
  InvestorProfileSchema,
  StartupProfileInputSchema,
  StartupProfileSchema
} from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import type { InvestorProfile, StartupProfile } from "@/lib/types";

const KEY_STARTUP = "capitalflow.startupProfile.v1";
const KEY_INVESTOR = "capitalflow.investorProfile.v1";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  // short, stable-enough id for local demo usage
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function loadStartupProfile(): StartupProfile | null {
  if (!canUseBrowserStorage()) return null;
  const raw = window.localStorage.getItem(KEY_STARTUP);
  if (!raw) return null;
  const parsed = safeJsonParse(raw);
  const res = StartupProfileSchema.safeParse(parsed);
  return res.success ? res.data : null;
}

export function loadInvestorProfile(): InvestorProfile | null {
  if (!canUseBrowserStorage()) return null;
  const raw = window.localStorage.getItem(KEY_INVESTOR);
  if (!raw) return null;
  const parsed = safeJsonParse(raw);
  const res = InvestorProfileSchema.safeParse(parsed);
  return res.success ? res.data : null;
}

const MAX_PITCH_DECK_BYTES = 10 * 1024 * 1024; // 10MB

export async function upsertStartupProfile(
  input: unknown,
  pitchDeckFile?: File | null
): Promise<StartupProfile> {
  // Validate shape on the client before sending.
  const parsed = StartupProfileInputSchema.parse(input);

  let pitchDeckUrl: string | undefined;
  if (pitchDeckFile) {
    const isPdf =
      pitchDeckFile.type === "application/pdf" ||
      pitchDeckFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new Error("Pitch deck must be a PDF file.");
    }
    if (pitchDeckFile.size > MAX_PITCH_DECK_BYTES) {
      throw new Error("Pitch deck must be 10MB or smaller.");
    }

    const startupId = crypto.randomUUID();
    const filePath = `${startupId}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("pitch-decks")
      .upload(filePath, pitchDeckFile, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      console.error("PITCH DECK UPLOAD ERROR:", uploadError);
      throw new Error(uploadError.message || "Failed to upload pitch deck.");
    }

    const { data: publicData } = supabase.storage
      .from("pitch-decks")
      .getPublicUrl(filePath);
    pitchDeckUrl = publicData.publicUrl;
  }

  const res = await fetch("/api/profiles/startup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...parsed,
      pitchDeckUrl
    })
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
      throw new Error(typeof data?.error === "string" ? data.error : JSON.stringify(data?.error));
    }
    throw new Error(await res.text());
  }

  const data = (await res.json()) as { profile: StartupProfile };
  const profile = StartupProfileSchema.parse(data.profile);

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(KEY_STARTUP, JSON.stringify(profile));
  }

  return profile;
}

export async function upsertInvestorProfile(input: unknown): Promise<InvestorProfile> {
  const parsed = InvestorProfileInputSchema.parse(input);

  const res = await fetch("/api/investor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed)
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as { error?: unknown } | null;
      throw new Error(typeof data?.error === "string" ? data.error : JSON.stringify(data?.error));
    }
    throw new Error(await res.text());
  }

  const data = (await res.json()) as { profile: InvestorProfile };
  const profile = InvestorProfileSchema.parse(data.profile);

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(KEY_INVESTOR, JSON.stringify(profile));
  }

  return profile;
}

export function clearProfiles() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(KEY_STARTUP);
  window.localStorage.removeItem(KEY_INVESTOR);
}

export function parseZodErrors(err: unknown): string[] {
  if (err instanceof z.ZodError) {
    return err.issues.map((i) => i.message);
  }
  return ["Something went wrong. Please try again."];
}

