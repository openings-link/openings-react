"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Docs" },
  { href: "/examples", label: "Examples" },
  { href: "/demo", label: "Live Demo", accent: true },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        padding: "0 24px",
        borderBottom: "1px solid #e5e5e5",
        background: "#fff",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#1a1a1a",
            textDecoration: "none",
          }}
        >
          Openings React
        </Link>

        {/* Desktop nav */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: active || item.accent ? 600 : 400,
                  color: active ? "#1a1a1a" : item.accent ? "#8B5CF6" : "#666",
                  background: active ? "#f5f5f5" : "transparent",
                  textDecoration: "none",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Burger button (mobile) */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="burger-btn"
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: "#333",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {menuOpen ? (
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            background: "#fff",
            borderBottom: "1px solid #e5e5e5",
            padding: "8px 16px 16px",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: active || item.accent ? 600 : 400,
                  color: active ? "#1a1a1a" : item.accent ? "#8B5CF6" : "#666",
                  background: active ? "#f5f5f5" : "transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .burger-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
