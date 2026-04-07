"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText, User, Shield } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const platformLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Matches", href: "/dashboard/matches", icon: Users, badge: "3" },
    { name: "Investors", href: "/investors", icon: Users },
    { name: "Pitch Builder", href: "/pitch-builder", icon: FileText },
  ];

  const profileLinks = [
    { name: "Startup Profile", href: "/startup", icon: User },
    { name: "Investor View", href: "/investor", icon: Shield },
  ];

  return (
    <div
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--vm-white)",
        borderRight: "1px solid var(--vm-slate-5)",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo Area */}
      <div className="px-4 py-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="CapitalFlow AI logo"
            width={140}
            height={40}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* PLATFORM section */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--vm-slate-4)", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px" }}>
            PLATFORM
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {platformLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    background: active ? "var(--vm-indigo-light)" : "transparent",
                    color: active ? "var(--vm-indigo)" : "var(--vm-slate-2)",
                    fontWeight: active ? 500 : 400,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--vm-slate-6)";
                      e.currentTarget.style.color = "var(--vm-slate)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--vm-slate-2)";
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span style={{ fontSize: "13.5px" }}>{item.name}</span>
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: "auto",
                        background: "var(--vm-indigo)",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "20px",
                        padding: "1px 7px",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* PROFILE section */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--vm-slate-4)", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px" }}>
            PROFILE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {profileLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    background: active ? "var(--vm-indigo-light)" : "transparent",
                    color: active ? "var(--vm-indigo)" : "var(--vm-slate-2)",
                    fontWeight: active ? 500 : 400,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--vm-slate-6)";
                      e.currentTarget.style.color = "var(--vm-slate)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--vm-slate-2)";
                    }
                  }}
                >
                  <item.icon size={18} />
                  <span style={{ fontSize: "13.5px" }}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

    </div>
  );
}
