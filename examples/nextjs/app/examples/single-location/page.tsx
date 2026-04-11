"use client";

import { BookingWidget } from "@openings-link/react-ui";
import { singleLocationClient } from "../../mockClient";

const CODE = `import { BookingWidget } from "@openings-link/react-ui";

// When a business has only one schedule, the widget
// skips the location picker and goes straight to booking.
<BookingWidget
  business="demo"
  theme={{ accent: "#059669" }}
  on={{
    onBookingComplete: (result) => {
      console.log("Booked!", result);
    },
  }}
/>`;

export default function SingleLocationPage() {
  return (
    <div>
      <h1>Single-location Business</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        A business with a <strong>pre-selected schedule</strong>. The location
        step is skipped automatically — the customer goes straight to picking a
        service and time.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Same barbershop, but only the East Village location is returned. The
        location picker is skipped automatically.
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
          apiClient={singleLocationClient}
          theme={{ accent: "#059669" }}
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
