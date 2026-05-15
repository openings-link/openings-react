import {
  useBookingFlow,
  formatPrice,
  formatDuration,
  formatTime,
  type MemberOpenings,
  type SelectedService,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";

interface Props {
  labels: BookingLabels;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingSummary({
  selectedServices,
  selectedDate,
  selectedTime,
  selectedMember,
  compact = false,
}: {
  selectedServices: SelectedService[];
  selectedDate: string | null;
  selectedTime: string | null;
  selectedMember: MemberOpenings | null;
  compact?: boolean;
}) {
  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + (s.option?.price ?? s.price),
    0,
  );
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + (s.option?.duration ?? s.duration),
    0,
  );

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid var(--openings-border, #e5e5e5)",
    fontSize: 14,
  };

  return (
    <div>
      <div
        style={{
          border: "1px solid var(--openings-border, #e5e5e5)",
          borderRadius: "var(--openings-radius, 8px)",
          padding: "4px 16px",
          marginBottom: compact ? 16 : 20,
        }}
      >
        {/* Services */}
        {selectedServices.map((s) => (
          <div key={s.id} style={rowStyle}>
            <span>
              {s.title}
              {s.option?.title ? ` (${s.option.title})` : ""}
            </span>
            <span
              style={{
                color: "var(--openings-muted, #666)",
                whiteSpace: "nowrap",
              }}
            >
              {formatPrice(s.option?.price ?? s.price)} ·{" "}
              {formatDuration(s.option?.duration ?? s.duration)}
            </span>
          </div>
        ))}

        {/* Total (if multiple services) */}
        {selectedServices.length > 1 && (
          <div
            style={{
              ...rowStyle,
              fontWeight: 600,
              borderBottom: "none",
            }}
          >
            <span>Total</span>
            <span>
              {formatPrice(totalPrice)} · {formatDuration(totalDuration)}
            </span>
          </div>
        )}

        {/* Member */}
        {selectedMember?.name && (
          <div style={rowStyle}>
            <span style={{ color: "var(--openings-muted, #666)" }}>With</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selectedMember.photo ? (
                <img
                  src={selectedMember.photo}
                  alt=""
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
              {selectedMember.name}
            </span>
          </div>
        )}

        {/* Date & time */}
        {selectedDate && selectedTime && (
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={{ color: "var(--openings-muted, #666)" }}>When</span>
            <span>
              {formatDateShort(selectedDate)} at {formatTime(selectedTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewStep({ labels }: Props) {
  const {
    selectedServices,
    selectedDate,
    selectedTime,
    selectedMember,
    goToVerify,
    loading,
  } = useBookingFlow();

  return (
    <div>
      <BookingSummary
        selectedServices={selectedServices}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedMember={selectedMember}
      />

      <button
        type="button"
        onClick={goToVerify}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "var(--openings-accent, #000)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--openings-radius, 8px)",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--openings-font, inherit)",
          fontSize: 16,
          fontWeight: 600,
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {labels.bookButton}
      </button>
    </div>
  );
}
