"use client";

const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: 20,
  background: "#fff",
  textDecoration: "none",
  color: "inherit",
  display: "block",
  transition: "border-color 0.15s ease",
};

const examples = [
  {
    href: "/examples/multi-location",
    title: "Multi-location Business",
    accent: "#8B5CF6",
    description:
      "2 locations in NYC. Customer picks a location first, then sees staff and services for that location.",
  },
  {
    href: "/examples/single-location",
    title: "Single-location Business",
    accent: "#059669",
    description:
      "Pre-selects a schedule — the location step is skipped and booking starts immediately with service selection.",
  },
  {
    href: "/examples/staff",
    title: "Staff Booking",
    accent: "#dc2626",
    description:
      "A specific staff member's booking page. Shows only their services, time slots grouped by location.",
  },
];

export default function ExamplesPage() {
  return (
    <div>
      <h1>Examples</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Interactive demos showing different booking configurations using mock
        data — no live API needed.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {examples.map((ex) => (
          <a key={ex.href} href={ex.href} style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: ex.accent,
                  flexShrink: 0,
                }}
              />
              <strong style={{ fontSize: 16 }}>{ex.title}</strong>
            </div>
            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: 14,
                lineHeight: 1.5,
                paddingLeft: 20,
              }}
            >
              {ex.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
