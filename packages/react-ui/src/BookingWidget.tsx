import {
  OpeningsProvider,
  useBookingFlow,
  useServiceRequest,
  type OpeningsCallbacks,
  type BookingEntry,
  type ApiClient,
  type MemberOpenings,
  type SelectedService,
} from "@openings/react";
import type { ReactNode } from "react";
import { themeToCssVars, type BookingTheme } from "./theme";
import { defaultLabels, type BookingLabels } from "./labels";
import { ScheduleStep } from "./components/ScheduleStep";
import { OpeningsStep } from "./components/OpeningsStep";
import { ReviewStep } from "./components/ReviewStep";
import { VerifyStep } from "./components/VerifyStep";
import { ConfirmStep } from "./components/ConfirmStep";
import { ServiceRequestStep } from "./components/ServiceRequestStep";

interface BookingWidgetProps {
  /** Business handle (slug). Required. */
  business: string;
  /** API base URL. */
  apiBase?: string;
  /** Pre-select a specific schedule (skip the schedule list). */
  scheduleId?: string;
  /** Pre-select a specific team member. */
  memberId?: string;
  /** Theme / styling options. */
  theme?: BookingTheme;
  /** Label overrides for i18n. */
  labels?: Partial<BookingLabels>;
  /** Custom API client (for testing or mock data). */
  apiClient?: ApiClient;
  /** Event callbacks. */
  on?: OpeningsCallbacks;
  /** Called when a user clicks "Send a Request" on a consultation service.
   * If not provided, the built-in service request form is shown. */
  onConsultationRequest?: (
    member: MemberOpenings,
    services: SelectedService[],
  ) => void;
  /** Class name for the root container. */
  className?: string;
}

export function BookingWidget({
  business,
  apiBase,
  scheduleId,
  memberId,
  theme,
  labels: labelOverrides,
  apiClient,
  on,
  onConsultationRequest,
  className,
}: BookingWidgetProps) {
  const cssVars = themeToCssVars(theme);
  const labels = { ...defaultLabels, ...labelOverrides };

  const entry: BookingEntry | undefined =
    scheduleId || memberId ? { scheduleId, memberId } : undefined;

  return (
    <OpeningsProvider
      business={business}
      apiBase={apiBase}
      apiClient={apiClient}
      entry={entry}
      on={on}
    >
      <style>{`
        @keyframes openings-spin { to { transform: rotate(360deg) } }
        @keyframes openings-scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        [data-openings-widget] button { transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease; }
        [data-openings-widget] button:active:not(:disabled) { transform: scale(0.97); }
        [data-openings-widget] .openings-slot:hover { border-color: var(--openings-accent, #000) !important; box-shadow: 0 0 0 1px var(--openings-accent, #000); }
        [data-openings-widget] .openings-back:hover { background: var(--openings-border, #e5e5e5) !important; }
      `}</style>
      <div
        className={className}
        style={{
          ...(cssVars as React.CSSProperties),
          fontFamily: "var(--openings-font, inherit)",
          color: "var(--openings-text, #111)",
          lineHeight: 1.5,
        }}
        data-openings-widget
      >
        <BookingWidgetInner
          labels={labels}
          onConsultationRequest={onConsultationRequest}
        />
      </div>
    </OpeningsProvider>
  );
}

function BookingWidgetInner({
  labels,
  onConsultationRequest,
}: {
  labels: BookingLabels;
  onConsultationRequest?: (
    member: MemberOpenings,
    services: SelectedService[],
  ) => void;
}) {
  const flow = useBookingFlow();
  const serviceRequest = useServiceRequest();

  // When no external handler is provided, use the built-in service request form
  const consultationHandler =
    onConsultationRequest ??
    (((member: MemberOpenings) => {
      serviceRequest.startRequest(member);
    }) as (member: MemberOpenings, services: SelectedService[]) => void);

  // Show a spinner until business is loaded and entry point is resolved.
  // This prevents child steps from flashing "no data" while fetches are in flight.
  if (flow.businessLoading || !flow.entryResolved) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div
          style={{
            width: 28,
            height: 28,
            border: "2px solid var(--openings-border, #e5e5e5)",
            borderTopColor: "var(--openings-accent, #000)",
            borderRadius: "50%",
            animation: "openings-spin 0.6s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }

  const stepContent: Record<string, ReactNode> = {
    schedule: <ScheduleStep labels={labels} />,
    openings: (
      <OpeningsStep
        labels={labels}
        onSlotSelected={flow.goToReview}
        onConsultationRequest={consultationHandler}
      />
    ),
    review: <ReviewStep labels={labels} />,
    verify: <VerifyStep labels={labels} />,
    confirm: (
      <ConfirmStep
        labels={labels}
        serviceRequestResult={serviceRequest.result}
      />
    ),
    "service-request": <ServiceRequestStep labels={labels} />,
  };

  return (
    <div>
      {/* Header: back button + selected location */}
      {flow.canGoBack && flow.step !== "confirm" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <button
            onClick={flow.goBack}
            type="button"
            className="openings-back"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 6,
              background: "var(--openings-surface, #f5f5f5)",
              color: "var(--openings-muted, #555)",
              cursor: "pointer",
              fontSize: 18,
              flexShrink: 0,
            }}
            aria-label={labels.back}
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
          {flow.selectedScheduleId &&
            (flow.schedules ?? []).length > 1 &&
            (() => {
              const schedule = (flow.schedules ?? []).find(
                (s) => s.id === flow.selectedScheduleId,
              );
              return schedule ? (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--openings-muted, #666)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {schedule.title}
                </span>
              ) : null;
            })()}
        </div>
      )}

      {flow.error && flow.step !== "verify" && (
        <div
          role="alert"
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: "var(--openings-radius, 8px)",
            fontSize: 14,
          }}
        >
          {flow.error}
        </div>
      )}

      {stepContent[flow.step] ?? null}
    </div>
  );
}
