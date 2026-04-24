"use client";

import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";
import type { MemberOpenings } from "@openings-link/react";
import { multiLocationClient } from "../../mockClient";
import { StaffInfoModal } from "../../StaffInfoModal";

const CODE = `import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";
import type { MemberOpenings } from "@openings-link/react";

function MyBookingPage() {
  // Pass \`onStaffInfoClick\` to opt into the info icon next to each
  // staff member. When the user clicks it, you render your own
  // mini-profile UI — bio, photos, reviews, etc.
  //
  // Omit the prop and no info icon is rendered.
  const [infoMember, setInfoMember] = useState<MemberOpenings | null>(null);

  return (
    <>
      <BookingWidget
        business="demo"
        theme={{ accent: "#8B5CF6", radius: 10 }}
        onStaffInfoClick={setInfoMember}
        on={{
          onBookingComplete: (result) => {
            console.log("Booked!", result);
          },
        }}
      />
      {infoMember && (
        <MyStaffProfileModal
          member={infoMember}
          onClose={() => setInfoMember(null)}
        />
      )}
    </>
  );
}`;

export default function MultiLocationPage() {
  const [infoMember, setInfoMember] = useState<MemberOpenings | null>(null);

  return (
    <div>
      <h1>Multi-location Business</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        A business with <strong>multiple schedules</strong> (locations). The
        customer picks a location first, then sees only the staff and services
        available there.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Demo Barbershop has 2 locations in NYC. Click the info icon next to a
        staff member to see an example host-supplied mini-profile modal.
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
          onStaffInfoClick={setInfoMember}
          on={{
            onBookingComplete: (result) => {
              console.log("Booked!", result);
            },
          }}
        />
      </div>

      <StaffInfoModal member={infoMember} onClose={() => setInfoMember(null)} />

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
