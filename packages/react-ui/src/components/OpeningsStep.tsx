import { useState, useEffect, useRef, useCallback } from "react";
import {
  useServices,
  useOpenings,
  useBookingFlow,
  formatPrice,
  formatDuration,
  formatTime,
  type SelectedService,
  type MemberOpenings,
  type NextAvailabilityItem,
  type Schedule,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";

interface Props {
  labels: BookingLabels;
  onSlotSelected?: () => void;
  onConsultationRequest?: (
    member: MemberOpenings,
    services: SelectedService[],
  ) => void;
  onStaffInfoClick?: (member: MemberOpenings) => void;
}

/* ── Staff info icon button ── */

function StaffInfoButton({
  member,
  label,
  onClick,
}: {
  member: MemberOpenings;
  label: string;
  onClick: (member: MemberOpenings) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick(member);
      }}
      style={{
        width: 24,
        height: 24,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "50%",
        background: "transparent",
        color: "var(--openings-muted, #888)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="4.5" r="0.9" fill="currentColor" />
        <path
          d="M8 7v5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

/* ── Date helpers ── */

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

function formatDateLabel(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return "Today";
  const tomorrow = addDays(today, 1);
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ── Mini Calendar ── */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MiniCalendar({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const valueParts = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(valueParts[0]);
  const [viewMonth, setViewMonth] = useState(valueParts[1] - 1);
  const today = todayStr();

  // Close on outside click. Use `click` (not `mousedown`) so the toggle
  // button's own onClick has already flipped state to `false` by the time
  // this fires — otherwise mousedown would close, then onClick would
  // re-toggle and the calendar would never close on a second toggle-click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 4,
        background: "var(--openings-bg, #fff)",
        border: "1px solid var(--openings-border, #e5e5e5)",
        borderRadius: "var(--openings-radius, 8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        padding: 12,
        zIndex: 10,
        width: 280,
      }}
    >
      {/* Month navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={prevMonth}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--openings-text, #111)",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 1L3 6l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--openings-text, #111)",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M4 1l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--openings-muted, #999)",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
        }}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isPast = dateStr < today;
          const isSelected = dateStr === value;
          const isToday = dateStr === today;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => {
                onChange(dateStr);
                onClose();
              }}
              style={{
                width: 36,
                height: 36,
                margin: "1px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "50%",
                background: isSelected
                  ? "var(--openings-accent, #000)"
                  : "transparent",
                color: isSelected
                  ? "#fff"
                  : isPast
                    ? "var(--openings-border, #ccc)"
                    : "var(--openings-text, #111)",
                fontWeight: isToday ? 700 : 400,
                fontSize: 13,
                cursor: isPast ? "default" : "pointer",
                fontFamily: "var(--openings-font, inherit)",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Combine Services Panel ── */

function CombineServicesPanel({
  services,
  initialSelection,
  onSubmit,
  onClose,
  labels,
  showPricing,
}: {
  services: {
    id: string;
    title: string;
    price: number;
    duration: number;
    up?: boolean;
    hasConsultation?: boolean;
    options?: SelectedService["options"];
  }[];
  initialSelection: SelectedService[];
  onSubmit: (services: SelectedService[]) => void;
  onClose: () => void;
  labels: BookingLabels;
  showPricing: boolean;
}) {
  const [selected, setSelected] = useState<SelectedService[]>(
    () => initialSelection,
  );

  const countOf = (id: string) => selected.filter((s) => s.id === id).length;

  const addService = (svc: (typeof services)[number]) => {
    setSelected((prev) => [
      ...prev,
      {
        id: svc.id,
        title: svc.title,
        price: svc.price,
        duration: svc.duration,
        options: svc.options,
        hasConsultation: svc.hasConsultation,
      },
    ]);
  };

  const removeService = (svc: (typeof services)[number]) => {
    setSelected((prev) => {
      const idx = prev.findIndex((s) => s.id === svc.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const totalPrice = selected.reduce(
    (sum, s) => sum + (s.option?.price ?? s.price),
    0,
  );
  const totalDuration = selected.reduce(
    (sum, s) => sum + (s.option?.duration ?? s.duration),
    0,
  );

  return (
    <div
      style={{
        border: "1px solid var(--openings-border, #e5e5e5)",
        borderRadius: "var(--openings-radius, 8px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--openings-border, #e5e5e5)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          {labels.combineServicesTitle}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "var(--openings-muted, #666)",
            padding: "2px 6px",
            fontFamily: "var(--openings-font, inherit)",
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: "8px 14px" }}>
        {services.map((svc, idx) => {
          const count = countOf(svc.id);
          const isLast = idx === services.length - 1;
          return (
            <div
              key={svc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: isLast
                  ? "none"
                  : "1px solid var(--openings-border, #f0f0f0)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{svc.title}</div>
                {showPricing && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--openings-muted, #666)",
                    }}
                  >
                    {formatPrice(svc.price)}
                    {svc.up ? "+" : ""} · {formatDuration(svc.duration)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => removeService(svc)}
                  disabled={count === 0}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--openings-border, #e5e5e5)",
                    borderRadius: 6,
                    background: "var(--openings-bg, #fff)",
                    cursor: count === 0 ? "not-allowed" : "pointer",
                    opacity: count === 0 ? 0.3 : 1,
                    fontSize: 16,
                    color: "var(--openings-text, #111)",
                    fontFamily: "var(--openings-font, inherit)",
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => addService(svc)}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--openings-border, #e5e5e5)",
                    borderRadius: 6,
                    background: "var(--openings-bg, #fff)",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "var(--openings-text, #111)",
                    fontFamily: "var(--openings-font, inherit)",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderTop: "1px solid var(--openings-border, #e5e5e5)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--openings-muted, #666)" }}>
          {selected.length} service{selected.length !== 1 ? "s" : ""}
          {showPricing && (
            <>
              {" "}
              · {formatPrice(totalPrice)} · {formatDuration(totalDuration)}
            </>
          )}
        </span>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => onSubmit(selected)}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: 6,
            background:
              selected.length === 0
                ? "var(--openings-border, #e5e5e5)"
                : "var(--openings-accent, #000)",
            color:
              selected.length === 0 ? "var(--openings-muted, #999)" : "#fff",
            cursor: selected.length === 0 ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--openings-font, inherit)",
          }}
        >
          {labels.combineServicesSubmit}
        </button>
      </div>
    </div>
  );
}

export function OpeningsStep({
  labels,
  onSlotSelected,
  onConsultationRequest,
  onStaffInfoClick,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
  const {
    services,
    selectedServices,
    selectService,
    removeService,
    setServices,
    members,
  } = useServices();
  const {
    memberOpenings,
    loading: openingsLoading,
    selectedDate,
    selectedTime,
    selectDate,
    selectSlot,
  } = useOpenings();

  const { selectedMemberId, schedules } = useBookingFlow();
  const {
    findNextAvailability,
    nextAvailability,
    nextAvailabilityLoading,
    nextAvailabilityError,
    clearNextAvailability,
  } = useBookingFlow();

  const isMemberMode = !!selectedMemberId;

  // Auto-select today's date and first service are handled in
  // BookingWidgetInner so the openings fetch can kick off before this step
  // mounts (otherwise the unified loading gate would deadlock).

  const currentDate = selectedDate || todayStr();
  const isPastDisabled = currentDate <= todayStr();

  const handlePrevDay = () => {
    if (!isPastDisabled) selectDate(addDays(currentDate, -1));
  };
  const handleNextDay = () => {
    selectDate(addDays(currentDate, 1));
  };

  const CUSTOM_VALUE = "__combine__";

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === CUSTOM_VALUE) {
      setCombineOpen(true);
      return;
    }
    const svc = services.find((s) => s.id === value);
    if (svc) {
      setServices([
        {
          id: svc.id,
          title: svc.title,
          price: svc.price,
          duration: svc.duration,
          options: svc.options,
          hasConsultation: svc.hasConsultation,
        },
      ]);
    }
  };

  const handleCombineSubmit = (svcs: SelectedService[]) => {
    setCombineOpen(false);
    if (svcs.length > 0) {
      setServices(svcs);
    }
  };

  const clearToSingle = () => {
    const first = services[0];
    if (first) {
      setServices([
        {
          id: first.id,
          title: first.title,
          price: first.price,
          duration: first.duration,
          options: first.options,
          hasConsultation: first.hasConsultation,
        },
      ]);
    }
  };

  const handleConsultationClick = useCallback(
    (member: MemberOpenings) => {
      onConsultationRequest?.(member, selectedServices);
    },
    [onConsultationRequest, selectedServices],
  );

  const handleNextAvailabilitySelect = useCallback(
    (date: string, time: string, item: NextAvailabilityItem) => {
      clearNextAvailability();
      selectDate(date);

      if (!isMemberMode || !selectedMemberId) return;

      const member = members.find((m) => m.id === selectedMemberId);
      const selectedMemberOpenings: MemberOpenings = {
        userId: member?.userId ?? null,
        teamMemberId: member?.teamMemberId ?? null,
        username: member?.username ?? member?.id ?? selectedMemberId,
        name: member?.name ?? "",
        photo: member?.photo ?? undefined,
        schedule: item.schedule,
        openings: item.openings,
        openingLabels: item.openingLabels,
        dayStatus: item.dayStatus,
        services: selectedServices.map((service) => ({
          id: service.id,
          title: service.title,
          duration: service.option?.duration ?? service.duration,
          price: service.option?.price ?? service.price,
          hasConsultation: service.hasConsultation,
          option: service.option,
        })),
      };

      selectSlot(selectedMemberOpenings, time);
      onSlotSelected?.();
    },
    [
      clearNextAvailability,
      isMemberMode,
      members,
      onSlotSelected,
      selectDate,
      selectedMemberId,
      selectedServices,
      selectSlot,
    ],
  );

  // Check if any selected service requires consultation
  const isConsultation = selectedServices.some((sel) => {
    const svc = services.find((s) => s.id === sel.id);
    return Boolean(svc?.hasConsultation || sel.hasConsultation);
  });

  const primaryService = selectedServices[0];
  const isSingle = selectedServices.length === 1;
  const isMulti = selectedServices.length > 1;

  const combinedPrice = selectedServices.reduce(
    (sum, s) => sum + (s.option?.price ?? s.price),
    0,
  );
  const combinedDuration = selectedServices.reduce(
    (sum, s) => sum + (s.option?.duration ?? s.duration),
    0,
  );

  const membersWithSlots = memberOpenings.filter((m) => m.openings.length > 0);
  const membersWithoutSlots = memberOpenings.filter(
    (m) => m.openings.length === 0,
  );

  return (
    <div>
      {/* ── Date navigation (hidden for consultation services) ── */}
      {!isConsultation && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={isPastDisabled}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--openings-border, #e5e5e5)",
              borderRadius: "var(--openings-radius, 8px)",
              background: "var(--openings-bg, #fff)",
              cursor: isPastDisabled ? "not-allowed" : "pointer",
              opacity: isPastDisabled ? 0.3 : 1,
              fontSize: 18,
              color: "var(--openings-text, #111)",
            }}
            aria-label="Previous day"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 1L3 6l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 15,
              lineHeight: 1,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--openings-text, #111)",
              fontFamily: "var(--openings-font, inherit)",
              padding: "4px 8px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              {formatDateLabel(currentDate)}
            </span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              style={{ display: "block", flexShrink: 0 }}
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--openings-border, #e5e5e5)",
              borderRadius: "var(--openings-radius, 8px)",
              background: "var(--openings-bg, #fff)",
              cursor: "pointer",
              color: "var(--openings-text, #111)",
            }}
            aria-label="Next day"
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
          </button>
          {calendarOpen && (
            <MiniCalendar
              value={currentDate}
              onChange={selectDate}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>
      )}

      {/* ── Service selection ── */}
      {services.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--openings-muted, #666)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {labels.selectService}
          </div>

          {/* Single service: dropdown (+ combine option) */}
          {isSingle && !combineOpen && (
            <select
              value={primaryService?.id ?? ""}
              onChange={handleServiceChange}
              style={{
                width: "100%",
                padding: "10px 36px 10px 12px",
                border: "1px solid var(--openings-border, #e5e5e5)",
                borderRadius: "var(--openings-radius, 8px)",
                background: `var(--openings-bg, #fff) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center`,
                color: "var(--openings-text, #111)",
                fontSize: 15,
                fontFamily: "var(--openings-font, inherit)",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {isMemberMode
                    ? `${s.title} – ${formatPrice(s.price)} · ${formatDuration(s.duration)}`
                    : s.title}
                </option>
              ))}
              {services.length > 1 && (
                <option value={CUSTOM_VALUE}>{labels.combineServices}</option>
              )}
            </select>
          )}

          {/* Multiple services selected: show list with edit/clear */}
          {isMulti && !combineOpen && (
            <div
              style={{
                border: "1px solid var(--openings-border, #e5e5e5)",
                borderRadius: "var(--openings-radius, 8px)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "6px 10px",
                  borderBottom: "1px solid var(--openings-border, #f0f0f0)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCombineOpen(true)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--openings-accent, #000)",
                    fontWeight: 500,
                    fontFamily: "var(--openings-font, inherit)",
                    padding: "2px 4px",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={clearToSingle}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--openings-muted, #999)",
                    fontFamily: "var(--openings-font, inherit)",
                    padding: "2px 4px",
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: "4px 10px" }}>
                {selectedServices.map((svc, idx) => (
                  <div
                    key={`${svc.id}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "4px 0",
                      fontSize: 13,
                    }}
                  >
                    <span>{svc.title}</span>
                    {isMemberMode && (
                      <span style={{ color: "var(--openings-muted, #666)" }}>
                        {svc.option
                          ? `${svc.option.title} · ${formatPrice(svc.option.price)}`
                          : formatPrice(svc.price)}
                      </span>
                    )}
                    {!isMemberMode && svc.option && (
                      <span style={{ color: "var(--openings-muted, #666)" }}>
                        {svc.option.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: "6px 10px",
                  borderTop: "1px solid var(--openings-border, #f0f0f0)",
                  fontSize: 12,
                  color: "var(--openings-muted, #666)",
                }}
              >
                {selectedServices.length} services
                {isMemberMode && (
                  <>
                    {" "}
                    · {formatPrice(combinedPrice)} ·{" "}
                    {formatDuration(combinedDuration)}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Combine services panel */}
          {combineOpen && (
            <CombineServicesPanel
              services={services}
              initialSelection={selectedServices}
              onSubmit={handleCombineSubmit}
              onClose={() => setCombineOpen(false)}
              labels={labels}
              showPricing={isMemberMode}
            />
          )}
        </div>
      )}

      {/* ── Consultation notice ── */}
      {isConsultation && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: "var(--openings-surface, #f5f5f5)",
            borderRadius: "var(--openings-radius, 8px)",
            fontSize: 13,
            color: "var(--openings-muted, #666)",
          }}
        >
          {labels.consultationNotice}
        </div>
      )}

      {/* ── Openings / Consultation section ── */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--openings-muted, #666)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>
            {isConsultation ? labels.consultationRequired : labels.selectTime}
          </span>
          {!isConsultation && openingsLoading && (
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                border: "1.5px solid var(--openings-border, #e5e5e5)",
                borderTopColor: "var(--openings-accent, #000)",
                borderRadius: "50%",
                animation: "openings-spin 0.6s linear infinite",
                display: "inline-block",
              }}
            />
          )}
        </div>

        {!isConsultation &&
          !isMemberMode &&
          !openingsLoading &&
          membersWithSlots.length === 0 &&
          membersWithoutSlots.length === 0 && (
            <div
              style={{
                textAlign: "left",
                padding: "12px 0",
                color: "var(--openings-muted, #666)",
                fontSize: 14,
              }}
            >
              {labels.noSlots}
            </div>
          )}

        {/* ── Consultation mode: show members with "Send a Request" button ──
            Falls back to the schedule-detail `members` list when the openings
            API returned an empty set (e.g. selected day is a member's offday
            or vacation). Consultation requests don't require a real slot. */}
        {isConsultation &&
          (() => {
            const consultationMembers: MemberOpenings[] =
              memberOpenings.length > 0
                ? memberOpenings
                : (isMemberMode
                    ? members.filter((m) => m.id === selectedMemberId)
                    : members
                  ).map((m) => ({
                    userId: m.userId ?? null,
                    teamMemberId: m.teamMemberId ?? null,
                    username: m.username ?? m.id,
                    name: m.name ?? "",
                    photo: m.photo ?? undefined,
                    schedule: { id: "", title: "", address: null },
                    openings: [],
                    openingLabels: {},
                    services: primaryService
                      ? [
                          {
                            id: primaryService.id,
                            title: primaryService.title,
                            duration: primaryService.duration,
                            price: primaryService.price,
                            hasConsultation: true,
                          },
                        ]
                      : [],
                  }));
            return (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {consultationMembers.map((member) => {
                  const key = isMemberMode
                    ? (member.schedule?.id ?? member.username)
                    : (member.userId ?? member.teamMemberId ?? member.username);
                  // Prefer the member-specific service entry (with the
                  // member's own price/duration); fall back to the host
                  // selection so the row never blanks out while the
                  // openings refetch is in flight after a service swap.
                  const svc = primaryService
                    ? (member.services.find(
                        (s) =>
                          s.referenceId === primaryService.id ||
                          s.id === primaryService.id,
                      ) ?? {
                        id: primaryService.id,
                        title: primaryService.title,
                        price: primaryService.price,
                        duration: primaryService.duration,
                      })
                    : undefined;
                  return (
                    <div
                      key={key}
                      style={{
                        border: isMemberMode
                          ? "none"
                          : "1px solid var(--openings-border, #e5e5e5)",
                        borderRadius: "var(--openings-radius, 8px)",
                        overflow: "hidden",
                      }}
                    >
                      {!isMemberMode && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 14px",
                            borderBottom:
                              "1px solid var(--openings-border, #e5e5e5)",
                          }}
                        >
                          {!isMemberMode &&
                            (member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.name ?? ""}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  background:
                                    "var(--openings-surface, #f5f5f5)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 600,
                                  fontSize: 16,
                                  color: "var(--openings-muted, #666)",
                                  flexShrink: 0,
                                }}
                              >
                                {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                            ))}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {!isMemberMode && (
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 15,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {member.name}
                              </div>
                            )}
                            {svc && (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--openings-muted, #666)",
                                }}
                              >
                                {svc.title ?? ""}
                              </div>
                            )}
                          </div>
                          {!isMemberMode && onStaffInfoClick && (
                            <StaffInfoButton
                              member={member}
                              label={labels.staffInfo}
                              onClick={onStaffInfoClick}
                            />
                          )}
                        </div>
                      )}
                      <div style={{ padding: isMemberMode ? 0 : 12 }}>
                        <button
                          type="button"
                          onClick={() => handleConsultationClick(member)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            borderRadius: 6,
                            background: "var(--openings-accent, #000)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: "var(--openings-font, inherit)",
                          }}
                        >
                          {labels.sendRequest}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        {/* Panels: by location in member mode, by member otherwise */}
        {!isConsultation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {membersWithSlots.map((member) => {
              const key = isMemberMode
                ? (member.schedule?.id ?? member.username)
                : (member.userId ?? member.teamMemberId ?? member.username);
              // Same stale-tolerant lookup as the consultation panel above
              // — keeps the service info row stable while the background
              // openings refetch lands new member-specific pricing.
              const svc = primaryService
                ? (member.services.find(
                    (s) =>
                      s.referenceId === primaryService.id ||
                      s.id === primaryService.id,
                  ) ?? {
                    id: primaryService.id,
                    title: primaryService.title,
                    price: primaryService.price,
                    duration: primaryService.duration,
                  })
                : undefined;

              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid var(--openings-border, #e5e5e5)",
                    borderRadius: "var(--openings-radius, 8px)",
                    overflow: "hidden",
                  }}
                >
                  {/* Panel header: location in member mode, member info otherwise.
                      Always shown in member mode so the customer can see which
                      schedule the member will be working — even with a single
                      location. */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--openings-border, #e5e5e5)",
                    }}
                  >
                    {isMemberMode ? (
                      <>
                        {(() => {
                          const scheduleImg = schedules.find(
                            (s) =>
                              s.id === member.schedule?.id ||
                              s.title === member.schedule?.title,
                          )?.images?.[0];
                          // Render image only when one exists. No pin
                          // fallback — keeps the header text-first when the
                          // schedule has no photo.
                          return scheduleImg ? (
                            <img
                              src={scheduleImg}
                              alt={member.schedule?.title ?? ""}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "var(--openings-radius, 8px)",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : null;
                        })()}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {member.schedule?.title ?? "Schedule"}
                          </div>
                          {member.schedule?.address && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--openings-muted, #666)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {member.schedule.address}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name ?? ""}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "var(--openings-surface, #f5f5f5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: 16,
                              color: "var(--openings-muted, #666)",
                              flexShrink: 0,
                            }}
                          >
                            {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.name}
                          </div>
                          {svc && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--openings-muted, #666)",
                              }}
                            >
                              {svc.title ?? ""} · {formatPrice(svc.price ?? 0)}{" "}
                              · {formatDuration(svc.duration ?? 0)}
                            </div>
                          )}
                        </div>
                        {onStaffInfoClick && (
                          <StaffInfoButton
                            member={member}
                            label={labels.staffInfo}
                            onClick={onStaffInfoClick}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Time slots grid — auto-fill so labels never wrap on
                      narrow modals. Min cell width keeps "10:00 am" on a
                      single line; on wider widths we get more columns.
                      On mobile (≤480px) we force 4 columns so the layout
                      stays predictable. */}
                  <div className="openings-slot-grid" style={{ padding: 12 }}>
                    {member.openings.map((time, i) => (
                      <button
                        key={time}
                        type="button"
                        className={
                          selectedTime === time ? undefined : "openings-slot"
                        }
                        onClick={() => {
                          selectSlot(member, time);
                          onSlotSelected?.();
                        }}
                        style={{
                          padding: "8px 4px",
                          border: `1px solid ${
                            selectedTime === time
                              ? "var(--openings-accent, #000)"
                              : "var(--openings-border, #e5e5e5)"
                          }`,
                          borderRadius: 6,
                          background:
                            selectedTime === time
                              ? "var(--openings-accent, #000)"
                              : "var(--openings-bg, #fff)",
                          color:
                            selectedTime === time
                              ? "#fff"
                              : "var(--openings-text, #111)",
                          cursor: "pointer",
                          fontSize: 13,
                          fontFamily: "var(--openings-font, inherit)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                          animation: `openings-scaleIn 0.2s ease ${i * 0.02}s both`,
                        }}
                      >
                        {formatTime(time)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Locations/members with no openings */}
            {membersWithoutSlots.map((member) => {
              const key = isMemberMode
                ? (member.schedule?.id ?? member.username)
                : (member.userId ?? member.teamMemberId ?? member.username);
              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid var(--openings-border, #e5e5e5)",
                    borderRadius: "var(--openings-radius, 8px)",
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                    }}
                  >
                    {(() => {
                      if (isMemberMode) {
                        const scheduleImg = schedules.find(
                          (s) =>
                            s.id === member.schedule?.id ||
                            s.title === member.schedule?.title,
                        )?.images?.[0];
                        // No pin fallback — keep header text-first when
                        // the schedule has no photo.
                        return scheduleImg ? (
                          <img
                            src={scheduleImg}
                            alt={member.schedule?.title ?? ""}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "var(--openings-radius, 8px)",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : null;
                      }
                      return member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name ?? ""}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "var(--openings-surface, #f5f5f5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: 16,
                            color: "var(--openings-muted, #666)",
                            flexShrink: 0,
                          }}
                        >
                          {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {isMemberMode
                          ? (member.schedule?.title ?? "Schedule")
                          : member.name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--openings-muted, #999)",
                          fontStyle: "italic",
                        }}
                      >
                        All booked
                      </div>
                    </div>
                    {!isMemberMode && onStaffInfoClick && (
                      <StaffInfoButton
                        member={member}
                        label={labels.staffInfo}
                        onClick={onStaffInfoClick}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Find Next Availability — only in member booking mode. Schedule
            booking already shows multiple members per day, so a forward
            search is less useful and clutters the empty state. Rendered
            after the "All booked" panels so the schedule context appears
            first, then the forward-search affordance. */}
        {isMemberMode &&
          !isConsultation &&
          !openingsLoading &&
          membersWithSlots.length === 0 && (
            <NextAvailabilityPanel
              labels={labels}
              isMemberMode={isMemberMode}
              schedules={schedules}
              onSelect={handleNextAvailabilitySelect}
              onSearch={() => findNextAvailability()}
              loading={nextAvailabilityLoading}
              error={nextAvailabilityError}
              items={nextAvailability}
            />
          )}
      </div>
    </div>
  );
}

/* ── Find Next Availability ── */

function NextAvailabilityPanel({
  labels,
  isMemberMode,
  schedules,
  onSelect,
  onSearch,
  loading,
  error,
  items,
}: {
  labels: BookingLabels;
  isMemberMode: boolean;
  schedules: Schedule[];
  onSelect: (date: string, time: string, item: NextAvailabilityItem) => void;
  onSearch: () => void;
  loading: boolean;
  error: string | null;
  items: NextAvailabilityItem[];
}) {
  const hasSearched = items.length > 0 || error !== null || loading;

  // Initial state: prompt with a single button. Mirrors Eddie's pattern.
  if (!hasSearched) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          border: "1px solid var(--openings-border, #e5e5e5)",
          borderRadius: "var(--openings-radius, 8px)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "var(--openings-muted, #666)",
            marginBottom: 12,
          }}
        >
          {labels.noOpeningsKeepLooking}
        </div>
        <button
          type="button"
          onClick={onSearch}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: 6,
            background: "var(--openings-accent, #000)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--openings-font, inherit)",
          }}
        >
          {labels.findNextAvailability}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          textAlign: "left",
          color: "var(--openings-muted, #666)",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            border: "2px solid var(--openings-border, #e5e5e5)",
            borderTopColor: "var(--openings-accent, #000)",
            borderRadius: "50%",
            animation: "openings-spin 0.6s linear infinite",
            display: "inline-block",
          }}
        />
        <span>{labels.searchingNextAvailability}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#fef2f2",
          color: "#dc2626",
          borderRadius: "var(--openings-radius, 8px)",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: "12px 0",
          color: "var(--openings-muted, #666)",
          fontSize: 14,
        }}
      >
        {labels.nextAvailabilityNoneFound}
      </div>
    );
  }

  // Group results by date — schedule-scoped results may have multiple
  // entries per date when several schedules have openings.
  const grouped: Record<string, NextAvailabilityItem[]> = {};
  for (const item of items) {
    (grouped[item.date] ??= []).push(item);
  }

  const formatDateHeading = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {Object.entries(grouped).map(([date, dateItems]) => (
        <div
          key={date}
          style={{
            border: "1px solid var(--openings-border, #e5e5e5)",
            borderRadius: "var(--openings-radius, 8px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--openings-border, #e5e5e5)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {formatDateHeading(date)}
          </div>
          {dateItems.map((item) => {
            // Find the schedule's address/title — fall back to the API's
            // payload, then to schedules list.
            const sched =
              schedules.find((s) => s.id === item.schedule.id) ?? null;
            return (
              <div key={`${date}-${item.schedule.id}`} style={{ padding: 12 }}>
                {isMemberMode && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--openings-muted, #666)",
                      marginBottom: 8,
                    }}
                  >
                    {item.schedule.title || sched?.title}
                  </div>
                )}
                <div className="openings-slot-grid">
                  {item.openings.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className="openings-slot"
                      onClick={() => onSelect(date, time, item)}
                      style={{
                        padding: "8px 4px",
                        border: "1px solid var(--openings-border, #e5e5e5)",
                        borderRadius: 6,
                        background: "var(--openings-bg, #fff)",
                        color: "var(--openings-text, #111)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "var(--openings-font, inherit)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
