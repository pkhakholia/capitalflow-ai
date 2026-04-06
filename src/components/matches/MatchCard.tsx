"use client";

import * as React from "react";
import { Check } from "lucide-react";

interface MatchCardProps {
  name: string;
  subtitle: string;
  avatarText: string;
  score: number;
  tags: {
    sector: string;
    stage: string;
    checkSize?: string;
  };
  strengths: string[];
  onContactClick?: () => void;
}

export function MatchCard({ name, subtitle, avatarText, score, tags, strengths, onContactClick }: MatchCardProps) {
  let scoreColor = "var(--vm-slate-2)";
  if (score >= 85) scoreColor = "var(--vm-emerald)";
  else if (score >= 70) scoreColor = "var(--vm-indigo)";
  else if (score >= 50) scoreColor = "var(--vm-amber)";

  return (
    <div
      style={{
        background: "var(--vm-white)",
        border: "1px solid var(--vm-slate-5)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 22px", display: "flex", gap: "16px", alignItems: "center", borderBottom: "1px solid var(--vm-slate-6)" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: "var(--vm-indigo-light)", color: "var(--vm-indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600 }}>
          {avatarText}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ fontSize: "13px", color: "var(--vm-slate-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "22px", fontWeight: 600, color: scoreColor, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--vm-slate-4)", marginTop: "4px", fontWeight: 600, letterSpacing: "0.5px" }}>
            MATCH
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 22px", flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <span style={{ background: "var(--vm-indigo-light)", color: "var(--vm-indigo)", padding: "4px 12px", borderRadius: "99px", fontSize: "11.5px", fontWeight: 600 }}>
            {tags.sector || "General"}
          </span>
          <span style={{ background: "var(--vm-emerald-light)", color: "var(--vm-emerald)", padding: "4px 12px", borderRadius: "99px", fontSize: "11.5px", fontWeight: 600 }}>
            {tags.stage || "Any Stage"}
          </span>
          {tags.checkSize && (
            <span style={{ background: "var(--vm-amber-light)", color: "var(--vm-amber)", padding: "4px 12px", borderRadius: "99px", fontSize: "11.5px", fontWeight: 600 }}>
              {tags.checkSize}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {strengths.map((str, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ background: "var(--vm-emerald-light)", color: "var(--vm-emerald)", borderRadius: "50%", padding: "2px", marginTop: "2px", flexShrink: 0 }}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span style={{ fontSize: "13px", color: "var(--vm-slate-2)", lineHeight: 1.5 }}>
                {str}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 22px", background: "var(--vm-slate-6)", display: "flex", gap: "12px", marginTop: "auto" }}>
        <button 
          onClick={onContactClick}
          style={{ background: "var(--vm-indigo)", color: "white", border: "none", padding: "8px 16px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 500, cursor: "pointer", flex: 1 }}
        >
          Contact Investor
        </button>
      </div>
    </div>
  );
}
