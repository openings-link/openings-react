import {
  OpeningsProvider,
  useBookingFlow,
  useServiceRequest,
  type OpeningsCallbacks,
  type BookingEntry,
  type BookingFeatures,
  type ApiClient,
  type MemberOpenings,
  type SelectedService,
} from "@openings-link/react";
import { useEffect, useRef, type ReactNode } from "react";
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
  /** Optional widget capabilities. Disabled by default. */
  features?: BookingFeatures;
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
  /** Called when a user clicks the info icon on a staff card in the schedule
   * view. When provided, an info button is rendered next to each staff name
   * so the host app can open its own mini-profile UI (bio, photos, etc.).
   * When omitted, no info button is shown. */
  onStaffInfoClick?: (member: MemberOpenings) => void;
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
  features,
  apiClient,
  on,
  onConsultationRequest,
  onStaffInfoClick,
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
      features={features}
      on={on}
    >
      <style>{`
        @keyframes openings-spin { to { transform: rotate(360deg) } }
        @keyframes openings-scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        [data-openings-widget] button { transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease; }
        [data-openings-widget] button:active:not(:disabled) { transform: scale(0.97); }
        [data-openings-widget] .openings-slot:hover { border-color: var(--openings-accent, #000) !important; box-shadow: 0 0 0 1px var(--openings-accent, #000); }
        [data-openings-widget] .openings-back:hover { background: var(--openings-border, #e5e5e5) !important; }
        [data-openings-widget] .openings-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
        @media (max-width: 480px) { [data-openings-widget] .openings-slot-grid { grid-template-columns: repeat(4, 1fr); } }
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
          features={features}
          onConsultationRequest={onConsultationRequest}
          onStaffInfoClick={onStaffInfoClick}
        />
      </div>
    </OpeningsProvider>
  );
}

function BookingWidgetInner({
  labels,
  onConsultationRequest,
  onStaffInfoClick,
  features,
}: {
  labels: BookingLabels;
  features?: BookingFeatures;
  onConsultationRequest?: (
    member: MemberOpenings,
    services: SelectedService[],
  ) => void;
  onStaffInfoClick?: (member: MemberOpenings) => void;
}) {
  const flow = useBookingFlow();
  const serviceRequest = useServiceRequest();

  // Auto-select today's date once the openings step is (or will be) active.
  // Lifted from OpeningsStep so the openings fetch can kick off before the
  // step mounts — otherwise the loading gate would deadlock (spinner waits
  // for openings fetch, but fetch needs a date which is set on mount).
  useEffect(() => {
    if (!flow.selectedDate) {
      const today = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      flow.selectDate(
        `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
      );
    }
  }, [flow.selectedDate, flow.selectDate, flow]);

  // Auto-select first service once services are loaded.
  useEffect(() => {
    if (flow.selectedServices.length === 0 && flow.services.length > 0) {
      const svc = flow.services[0];
      flow.selectService({
        id: svc.id,
        title: svc.title,
        price: svc.price,
        duration: svc.duration,
        options: svc.options,
        hasConsultation: svc.hasConsultation,
      });
    }
  }, [flow.services, flow.selectedServices, flow.selectService, flow]);

  // Track whether the first openings fetch has completed so we can keep a
  // single unified spinner up from mount until the step is fully ready.
  // openingsLoading transitions true→false exactly once on first load; after
  // that, date changes still trigger openingsLoading but the full UI stays
  // mounted so there's no layout jump.
  const wasOpeningsLoadingRef = useRef(false);
  const openingsFetchedOnceRef = useRef(false);
  if (flow.openingsLoading) {
    wasOpeningsLoadingRef.current = true;
  } else if (wasOpeningsLoadingRef.current) {
    openingsFetchedOnceRef.current = true;
    wasOpeningsLoadingRef.current = false;
  }

  // When no external handler is provided, use the built-in service request form
  const consultationHandler =
    onConsultationRequest ??
    (((member: MemberOpenings) => {
      serviceRequest.startRequest(member);
    }) as (member: MemberOpenings, services: SelectedService[]) => void);

  // Unified loading gate: keep a single spinner up from mount until the
  // openings step is fully ready. Covers the window where entry is resolved
  // but schedule-detail is still fetching (so step is still "schedule") —
  // without this we'd flash ScheduleStep, then OpeningsStep with empty
  // services, then finally the populated UI.
  const hasEnteredOpeningsRef = useRef(false);
  if (flow.step === "openings") {
    hasEnteredOpeningsRef.current = true;
  }

  // Reset the persistent "first run" refs whenever the flow re-enters
  // entry resolution (i.e. after a post-confirm reset). Without this, a
  // returning user would briefly see ScheduleStep / an empty OpeningsStep
  // flash before auto-select lands them back on the populated openings UI,
  // because the refs would carry "we already passed first-run" state from
  // the previous booking.
  if (!flow.entryResolved) {
    hasEnteredOpeningsRef.current = false;
    openingsFetchedOnceRef.current = false;
    wasOpeningsLoadingRef.current = false;
  }

  const willLandOnOpenings =
    !!flow.selectedScheduleId || !!flow.selectedMemberId;

  const openingsStepNotReady =
    (flow.step === "openings" ||
      (willLandOnOpenings && !hasEnteredOpeningsRef.current)) &&
    (flow.services.length === 0 || !openingsFetchedOnceRef.current);

  if (flow.error && (flow.businessLoading || !flow.entryResolved)) {
    return (
      <div
        role="alert"
        style={{
          padding: "10px 14px",
          background: "#fef2f2",
          color: "#dc2626",
          borderRadius: "var(--openings-radius, 8px)",
          fontSize: 14,
        }}
      >
        {flow.error}
      </div>
    );
  }

  if (flow.businessLoading || !flow.entryResolved || openingsStepNotReady) {
    return (
      <div
        aria-label="Loading booking widget"
        style={{ textAlign: "center", padding: "48px 0" }}
      >
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
        onStaffInfoClick={onStaffInfoClick}
      />
    ),
    review: <ReviewStep labels={labels} />,
    verify: <VerifyStep labels={labels} features={features} />,
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
          {(() => {
            // Step title takes priority over the schedule label so users
            // see "Booking summary" / "Verify" inline with the back button
            // (matches the multi-location header pattern from earlier steps).
            const stepTitle =
              flow.step === "review"
                ? labels.review
                : flow.step === "verify"
                  ? labels.verifyTitle
                  : flow.step === "service-request"
                    ? labels.serviceRequestTitle
                    : null;
            if (stepTitle) {
              return (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--openings-text, #111)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stepTitle}
                </span>
              );
            }
            if (flow.selectedScheduleId && (flow.schedules ?? []).length > 1) {
              const schedule = (flow.schedules ?? []).find(
                (s) => s.id === flow.selectedScheduleId,
              );
              return schedule ? (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--openings-text, #111)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {schedule.title}
                </span>
              ) : null;
            }
            return null;
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
