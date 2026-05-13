"use client";

import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";
import type { MemberOpenings } from "@openings-link/react";
import { singleLocationClient } from "../../mockClient";
import { StaffInfoModal } from "../../StaffInfoModal";

const CODE = `import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";
import type { MemberOpenings } from "@openings-link/react";

function MyBookingPage() {
  // \`onStaffInfoClick\` lets you plug in your own staff mini-profile.
  // Pass a handler → info icon appears next to each staff member.
  // Omit the prop → no icon is rendered.
  const [infoMember, setInfoMember] = useState<MemberOpenings | null>(null);

  return (
    <>
      <BookingWidget
        business="demo"
        appointmentMetadata={{ demo: "single-location" }}
        theme={{ accent: "#059669" }}
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

export default function SingleLocationPage() {
  const [infoMember, setInfoMember] = useState<MemberOpenings | null>(null);

  return (
    <div>
      <h1>Single-location Business</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        A business with a <strong>pre-selected schedule</strong>. The location
        step is skipped automatically — the customer goes straight to picking a
        service and time.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Same barbershop, but only the East Village location is returned. Click
        the info icon next to a staff member to see an example host-supplied
        mini-profile modal.
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
          appointmentMetadata={{ demo: "single-location" }}
          theme={{ accent: "#059669" }}
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
