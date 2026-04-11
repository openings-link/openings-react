"use client";

import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";

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
          on={{
            onBookingComplete: (result) => {
              console.log("Booked!", result);
            },
          }}
        />
      </div>
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
