"use client";

import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";
import type { MemberOpenings } from "@openings-link/react";

const demos = [
  {
    id: "multi",
    title: "Multi-location",
    description:
      "2 locations in NYC. Customer picks a location first, then sees staff and services.",
    accent: "#8B5CF6",
    props: {},
    code: `<BookingWidget business="demo" />`,
  },
  {
    id: "single",
    title: "Single-location",
    description:
      "Pre-selects East Village — skips the location picker and goes straight to booking.",
    accent: "#059669",
    props: { scheduleId: "cmnt2ks0t000204l4zflogbpl" },
    code: `<BookingWidget business="demo" scheduleId="cmnt2ks0t000204l4zflogbpl" />`,
  },
  {
    id: "staff",
    title: "Staff Booking",
    description:
      "John's booking page — shows only his services and availability.",
    accent: "#dc2626",
    props: { memberId: "cmnt27m4p000104l4486n4nqo" },
    code: `<BookingWidget business="demo" memberId="cmnt27m4p000104l4486n4nqo" />`,
  },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("multi");
  const [infoMember, setInfoMember] = useState<MemberOpenings | null>(null);
  const activeDemo = demos.find((d) => d.id === activeTab) ?? demos[0];

  return (
    <div>
      <h1>Live Demo</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        <strong>Real booking widgets</strong> connected to the Openings
        production API. Browse schedules, services, and time slots — all live
        data.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Powered by a demo account on{" "}
        <a
          href="https://openings.link"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#8B5CF6" }}
        >
          openings.link
        </a>
        .
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid #e5e5e5",
          paddingBottom: 0,
        }}
      >
        {demos.map((demo) => {
          const active = demo.id === activeTab;
          return (
            <button
              key={demo.id}
              type="button"
              onClick={() => setActiveTab(demo.id)}
              style={{
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? demo.accent : "#666",
                background: "none",
                border: "none",
                borderBottom: active
                  ? `2px solid ${demo.accent}`
                  : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
                transition: "color 0.15s ease",
              }}
            >
              {demo.title}
            </button>
          );
        })}
      </div>

      {/* Active demo */}
      <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
        {activeDemo.description}
      </p>
      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 24,
          background: "#fff",
        }}
      >
        {/* Key forces remount so each tab gets a fresh widget */}
        <BookingWidget
          key={activeDemo.id}
          business="demo"
          apiBase="/api/proxy"
          theme={{ accent: activeDemo.accent, radius: 10 }}
          {...activeDemo.props}
          onStaffInfoClick={
            activeDemo.id === "staff" ? undefined : setInfoMember
          }
          on={{
            onBookingComplete: (result) => {
              console.log("Booked!", result);
            },
          }}
        />
      </div>

      {/* Staff info modal — host-supplied fallback for onStaffInfoClick */}
      {infoMember && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setInfoMember(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 14,
              }}
            >
              {infoMember.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={infoMember.photo}
                  alt={infoMember.name}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#888",
                  }}
                >
                  {infoMember.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {infoMember.name}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  @{infoMember.username}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
              This is your own mini-profile UI. Fetch the full bio, portfolio
              photos, reviews, etc. from your backend and render them here.
            </p>
            <button
              type="button"
              onClick={() => setInfoMember(null)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                borderRadius: 8,
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#999",
          }}
        >
          Code
        </summary>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            overflow: "auto",
            marginTop: 8,
          }}
        >
          {activeDemo.code}
        </pre>
      </details>
    </div>
  );
}
