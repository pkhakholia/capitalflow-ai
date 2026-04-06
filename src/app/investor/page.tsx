"use client";

import * as React from "react";
import { Link2, MapPin, Edit2, Send, MessageSquare, CheckCircle2 } from "lucide-react";

export default function InvestorProfilePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--vm-surface)" }}>
      {/* Hero Layout */}
      <div style={{ background: "var(--vm-emerald-light)", borderBottom: "1px solid var(--vm-slate-5)", padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "var(--vm-emerald)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 600 }}>
              HV
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--vm-slate)", margin: 0 }}>Horizon Ventures</h1>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ border: "1px solid var(--vm-indigo)", color: "var(--vm-indigo)", padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600 }}>B2B SaaS</span>
                  <span style={{ border: "1px solid var(--vm-emerald)", color: "var(--vm-emerald)", padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600 }}>Series A</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--vm-slate-3)", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={14} />
                  London, UK
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Link2 size={14} />
                  <a href="#" style={{ color: "var(--vm-emerald)", textDecoration: "none" }}>horizon.vc</a>
                </div>
              </div>
            </div>
          </div>
          <button style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", color: "var(--vm-slate)", padding: "8px 16px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <Edit2 size={14} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ padding: "32px 40px", maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Investment Thesis Card */}
          <div style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "16px", marginTop: 0 }}>Investment Thesis</h2>
            <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--vm-slate-2)", margin: 0 }}>
              We back resilient founders building the infrastructure layer of tomorrow's internet. We focus strictly on B2B SaaS and DevTools, concentrating our capital where our operating experience lies. We believe that the next decade of enterprise value will be created by companies that reduce complexity, consolidate workflows, and empower developers to ship faster.
            </p>
          </div>

          {/* Value-Add Card */}
          <div style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "20px", marginTop: 0 }}>How We Support Founders</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={16} color="var(--vm-emerald)" style={{ marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "4px" }}>Talent Acquisition</div>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>Dedicated internal recruiting team to help you close engineering and executive hires.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={16} color="var(--vm-emerald)" style={{ marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "4px" }}>Go-to-Market Strategy</div>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>On-call operating partners who have scaled enterprise sales from $0 to $50M ARR.</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <CheckCircle2 size={16} color="var(--vm-emerald)" style={{ marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "4px" }}>Customer Introductions</div>
                  <div style={{ fontSize: "13px", color: "var(--vm-slate-3)" }}>A curated network of 500+ CIOs across the Fortune 1000.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Investments Card */}
          <div style={{ background: "var(--vm-white)", border: "1px solid var(--vm-slate-5)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--vm-slate)", marginBottom: "20px", marginTop: 0 }}>Recent Investments</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--vm-slate-6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--vm-slate-2)" }}>NX</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)" }}>NexaFlow</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--vm-emerald)", background: "var(--vm-emerald-light)", padding: "4px 8px", borderRadius: "99px", fontWeight: 600 }}>Seed</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--vm-slate-6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--vm-slate-2)" }}>OP</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)" }}>OpsGen</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--vm-indigo)", background: "var(--vm-indigo-light)", padding: "4px 8px", borderRadius: "99px", fontWeight: 600 }}>Series A</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--vm-slate-6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--vm-slate-2)" }}>VD</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--vm-slate)" }}>VercelData</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--vm-amber)", background: "var(--vm-amber-light)", padding: "4px 8px", borderRadius: "99px", fontWeight: 600 }}>Pre-Seed</div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Investment Criteria Side-card */}
          <div style={{ background: "var(--vm-emerald)", borderRadius: "var(--radius-lg)", padding: "24px", color: "white", boxShadow: "var(--shadow-md)" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 500, color: "var(--vm-emerald-light)", marginBottom: "4px", marginTop: 0 }}>Sweet Spot Check Size</h2>
            <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "28px", fontWeight: 600, marginBottom: "24px" }}>
              $1M - $3M
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "20px", paddingBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Target Ownership</span>
                <span style={{ fontWeight: 600 }}>10-15%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Lead vs. Follow</span>
                <span style={{ fontWeight: 600 }}>Lead preferred</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Board Seat</span>
                <span style={{ fontWeight: 600 }}>Required</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button style={{ background: "white", color: "var(--vm-slate)", border: "none", padding: "10px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                <Send size={16} />
                Send Pitch
              </button>
              <button style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "10px", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <MessageSquare size={16} />
                Message
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
