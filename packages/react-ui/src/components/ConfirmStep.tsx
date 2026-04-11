import {
  useBooking,
  useBookingFlow,
  formatPrice,
  formatTime,
  type ServiceRequestResult,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";

interface Props {
  labels: BookingLabels;
  serviceRequestResult?: ServiceRequestResult | null;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ConfirmStep({ labels, serviceRequestResult }: Props) {
  const { result, reset } = useBooking();
  const { selectedServices, selectedMember, selectedDate, selectedTime } =
    useBookingFlow();

  // Service request confirmation
  if (serviceRequestResult) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 28,
            color: "#16a34a",
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          {labels.serviceRequestSent}
        </div>
        <div
          style={{
            color: "var(--openings-muted, #666)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {labels.serviceRequestSentMessage}
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "var(--openings-accent, #000)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--openings-radius, 8px)",
            cursor: "pointer",
            fontFamily: "var(--openings-font, inherit)",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Done
        </button>
      </div>
    );
  }

  if (!result) return null;

  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + (s.option?.price ?? s.price),
    0,
  );

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid var(--openings-border, #e5e5e5)",
    fontSize: 14,
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* Success icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: 28,
          color: "#16a34a",
        }}
      >
        ✓
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        {labels.confirmTitle}
      </div>
      <div
        style={{
          color: "var(--openings-muted, #666)",
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        {labels.confirmMessage}
      </div>

      {/* Details card */}
      <div
        style={{
          border: "1px solid var(--openings-border, #e5e5e5)",
          borderRadius: "var(--openings-radius, 8px)",
          padding: "4px 16px",
          marginBottom: 20,
          textAlign: "left",
        }}
      >
        <div style={rowStyle}>
          <span style={{ color: "var(--openings-muted, #666)" }}>
            {selectedServices.length > 1 ? "Services" : "Service"}
          </span>
          <span>{selectedServices.map((s) => s.title).join(", ")}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: "var(--openings-muted, #666)" }}>Price</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        {selectedMember?.name && (
          <div style={rowStyle}>
            <span style={{ color: "var(--openings-muted, #666)" }}>
              Team member
            </span>
            <span>{selectedMember.name}</span>
          </div>
        )}
        {(selectedDate ?? result.date) && (
          <div style={rowStyle}>
            <span style={{ color: "var(--openings-muted, #666)" }}>Date</span>
            <span>{formatDateLong(selectedDate ?? result.date)}</span>
          </div>
        )}
        {(selectedTime ?? result.time) && (
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={{ color: "var(--openings-muted, #666)" }}>Time</span>
            <span>{formatTime(selectedTime ?? result.time)}</span>
          </div>
        )}
      </div>

      {/* Calendar buttons */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--openings-muted, #666)",
            marginBottom: 10,
          }}
        >
          Save to your calendar
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() =>
              downloadIcs(result, selectedServices, selectedMember)
            }
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "var(--openings-text, #111)",
              border: "1px solid var(--openings-border, #e5e5e5)",
              borderRadius: "var(--openings-radius, 8px)",
              cursor: "pointer",
              fontFamily: "var(--openings-font, inherit)",
              fontSize: 14,
            }}
          >
            📅 Apple
          </button>
          <a
            href={googleCalUrl(result, selectedServices, selectedMember)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: "var(--openings-text, #111)",
              border: "1px solid var(--openings-border, #e5e5e5)",
              borderRadius: "var(--openings-radius, 8px)",
              cursor: "pointer",
              fontFamily: "var(--openings-font, inherit)",
              fontSize: 14,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            📅 Google
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "var(--openings-accent, #000)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--openings-radius, 8px)",
          cursor: "pointer",
          fontFamily: "var(--openings-font, inherit)",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Done
      </button>
    </div>
  );
}

/* ── Calendar helpers (inlined, zero deps) ── */

interface CalParams {
  date: string;
  time: string;
  appointmentId: string;
}

function buildCalEvent(
  result: CalParams,
  services: {
    title: string;
    duration?: number;
    option?: { duration?: number };
  }[],
  member: { name?: string | null } | null,
) {
  const totalMinutes = services.reduce(
    (acc, s) => acc + (s.option?.duration ?? s.duration ?? 60),
    0,
  );
  const startStr = `${result.date}T${result.time}:00`;
  const startMs = new Date(startStr).getTime();
  const endMs = startMs + totalMinutes * 60_000;

  const title = "Appointment";
  const desc = [
    `Services: ${services.map((s) => s.title).join(", ")}`,
    member?.name ? `With: ${member.name}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { title, desc, startMs, endMs };
}

function toIcsDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function downloadIcs(
  result: CalParams,
  services: {
    title: string;
    duration?: number;
    option?: { duration?: number };
  }[],
  member: { name?: string | null } | null,
) {
  const ev = buildCalEvent(result, services, member);
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
  const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}@openings.link`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Openings//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(Date.now())}`,
    `DTSTART:${toIcsDate(ev.startMs)}`,
    `DTEND:${toIcsDate(ev.endMs)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.desc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "openings-appointment.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function googleCalUrl(
  result: CalParams,
  services: {
    title: string;
    duration?: number;
    option?: { duration?: number };
  }[],
  member: { name?: string | null } | null,
): string {
  const ev = buildCalEvent(result, services, member);
  const fmt = (ms: number) =>
    new Date(ms)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&details=${encodeURIComponent(ev.desc)}&dates=${fmt(ev.startMs)}/${fmt(ev.endMs)}&sf=true&output=xml`;
}
