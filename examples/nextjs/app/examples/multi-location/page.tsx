"use client";

import { BookingWidget } from "@openings/react-ui";
import { multiLocationClient } from "../../mockClient";

const CODE = `import { BookingWidget } from "@openings/react-ui";

<BookingWidget
  business="demo"
  theme={{ accent: "#8B5CF6", radius: 10 }}
  on={{
    onBookingComplete: (result) => {
      console.log("Booked!", result);
    },
  }}
/>`;

export default function MultiLocationPage() {
  return (
    <div>
      <h1>Multi-location Business</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        A business with <strong>multiple schedules</strong> (locations). The
        customer picks a location first, then sees only the staff and services
        available there.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Demo Barbershop has 2 locations in NYC. Each location has different
        barbers assigned to it.
      </p>
      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 24,
          background: "#fff",
        }}
      >
        <BookingWidget
          business="demo"
          apiClient={multiLocationClient}
          theme={{ accent: "#8B5CF6", radius: 10 }}
          on={{
            onBookingComplete: (result) => {
              console.log("Booked!", result);
            },
          }}
        />
      </div>

      <details style={{ marginTop: 32 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#666",
            marginBottom: 12,
          }}
        >
          React code
        </summary>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: 20,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            overflow: "auto",
          }}
        >
          <code>{CODE}</code>
        </pre>
      </details>
    </div>
  );
}
