"use client";

import { BookingWidget } from "@openings/react-ui";
import { multiLocationClient } from "../../mockClient";

const CODE = `import { BookingWidget } from "@openings/react-ui";

// Pass memberId to open a specific staff member's booking page.
// Shows only their services and availability across all locations.
<BookingWidget
  business="demo"
  memberId="mem_john"
  theme={{ accent: "#dc2626" }}
  on={{
    onBookingComplete: (result) => {
      console.log("Booked!", result);
    },
  }}
/>`;

export default function StaffPage() {
  return (
    <div>
      <h1>Staff Booking</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        Booking for a <strong>specific staff member</strong>. Only their
        services are shown, and time slots are grouped by location.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        John works at East Village and SoHo. The widget shows only his services
        and his availability at each location.
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
          memberId="mem_john"
          theme={{ accent: "#dc2626" }}
          on={{
            onBookingComplete: (result) => {
              console.log("Booked with John!", result);
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
