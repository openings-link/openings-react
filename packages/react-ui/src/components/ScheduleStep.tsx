import { useSchedules, useBusiness } from "@openings-link/react";
import type { BookingLabels } from "../labels";

interface Props {
  labels: BookingLabels;
}

export function ScheduleStep({ labels }: Props) {
  const { business } = useBusiness();
  const { schedules, selectSchedule, loading } = useSchedules();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <Spinner />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 0",
          color: "var(--openings-muted, #666)",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
        <div>No schedules available</div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {labels.selectSchedule}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {schedules.map((schedule) => (
          <button
            key={schedule.id}
            type="button"
            onClick={() => selectSchedule(schedule.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: 14,
              border: "1px solid var(--openings-border, #e5e5e5)",
              borderRadius: "var(--openings-radius, 8px)",
              background: "var(--openings-bg, #fff)",
              color: "var(--openings-text, #111)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--openings-font, inherit)",
              transition: "border-color 0.15s ease",
            }}
          >
            {schedule.images?.[0] ? (
              <img
                src={schedule.images[0]}
                alt={schedule.title}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "var(--openings-surface, #f5f5f5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                📍
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {schedule.title}
              </div>
              {schedule.address && (
                <div
                  style={{
                    color: "var(--openings-muted, #666)",
                    fontSize: 13,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {schedule.address}
                </div>
              )}
            </div>
            <div
              style={{
                color: "var(--openings-muted, #999)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4 1l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        border: "2px solid var(--openings-border, #e5e5e5)",
        borderTopColor: "var(--openings-accent, #000)",
        borderRadius: "50%",
        animation: "openings-spin 0.6s linear infinite",
        margin: "0 auto",
      }}
    />
  );
}
