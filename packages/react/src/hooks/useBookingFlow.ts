import { useCallback, useEffect } from "react";
import { useBookingContext } from "../context";
import { useBusiness } from "./useBusiness";
import { useSchedules } from "./useSchedules";
import { useServices } from "./useServices";
import { useOpenings } from "./useOpenings";
import { useBooking } from "./useBooking";
import type { Step, SelectedService, MemberOpenings } from "../types";

const STEP_ORDER: Step[] = [
  "schedule",
  "openings",
  "review",
  "verify",
  "confirm",
];

/**
 * Orchestrator hook — combines all booking hooks into a single step-based
 * state machine. Use this for the simplest integration.
 *
 * Entry point resolution:
 * - No entry props → schedule list (auto-selects if only one)
 * - `scheduleId` → skip list, load that schedule's services/slots
 * - `memberId` → show that member's availability
 * - `scheduleId` + `memberId` → member's slots at that schedule
 */
export function useBookingFlow() {
  const { state, dispatch } = useBookingContext();
  const { business, loading: businessLoading } = useBusiness();
  const { schedules, selectSchedule, selectedScheduleId } = useSchedules();
  const { services, members, selectedServices, selectService, removeService } =
    useServices();
  const {
    memberOpenings,
    loading: openingsLoading,
    selectedDate,
    selectedTime,
    selectedMember,
    selectDate,
    selectSlot,
    findNextAvailability,
    nextAvailability,
    nextAvailabilityLoading,
    nextAvailabilityError,
    clearNextAvailability,
  } = useOpenings();
  const booking = useBooking();

  // ── Entry point auto-selection ──
  useEffect(() => {
    // Wait until business + schedules are loaded
    if (!business || schedules.length === 0 || state.entryResolved) return;

    const { entryScheduleId, entryMemberId } = state;

    // If scheduleId entry prop is set, auto-select that schedule
    if (entryScheduleId) {
      const targetSchedule = schedules.find((s) => s.id === entryScheduleId);
      if (targetSchedule) {
        selectSchedule(entryScheduleId);
        if (entryMemberId) {
          dispatch({ type: "SET_SELECTED_MEMBER", memberId: entryMemberId });
        }
        dispatch({ type: "SET_ENTRY_RESOLVED" });
        return;
      }
    }

    // If only memberId is set (no schedule), skip to openings step.
    // The member's availability will be fetched across all schedules.
    if (entryMemberId && !entryScheduleId) {
      dispatch({ type: "SET_SELECTED_MEMBER", memberId: entryMemberId });
      // Auto-select first schedule so we skip past the schedule list
      if (schedules.length >= 1) {
        selectSchedule(schedules[0].id);
      }
      dispatch({ type: "SET_ENTRY_RESOLVED" });
      return;
    }

    // No entry props — auto-select if single schedule
    if (!entryScheduleId && !entryMemberId && schedules.length === 1) {
      selectSchedule(schedules[0].id);
    }

    dispatch({ type: "SET_ENTRY_RESOLVED" });
  }, [
    business,
    schedules,
    state.entryResolved,
    state.entryScheduleId,
    state.entryMemberId,
    selectSchedule,
    dispatch,
  ]);

  const step = state.step;

  const goTo = useCallback(
    (target: Step) => {
      dispatch({ type: "SET_STEP", step: target });
    },
    [dispatch],
  );

  // Don't allow going back past the entry point.
  // Also skip "schedule" when there's only one schedule (auto-selected).
  const entryStep: Step =
    state.entryScheduleId || state.entryMemberId || schedules.length <= 1
      ? "openings"
      : "schedule";
  const canGoBack =
    step === "service-request" ||
    (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(entryStep) &&
      step !== "confirm");

  const goBack = useCallback(() => {
    // Service-request is a branch off openings, go back there
    if (step === "service-request") {
      dispatch({ type: "SET_STEP", step: "openings" });
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      dispatch({ type: "SET_STEP", step: STEP_ORDER[idx - 1] });
    }
  }, [step, dispatch]);

  const goToReview = useCallback(() => {
    dispatch({ type: "SET_STEP", step: "review" });
  }, [dispatch]);

  const goToVerify = useCallback(() => {
    dispatch({ type: "SET_STEP", step: "verify" });
  }, [dispatch]);

  return {
    // Step navigation
    step,
    goTo,
    canGoBack,
    goBack,
    goToReview,
    goToVerify,

    // Business
    business,
    businessLoading,

    // Schedules
    schedules,
    selectSchedule,
    selectedScheduleId,

    // Entry point
    entryResolved: state.entryResolved,
    selectedMemberId: state.selectedMemberId,

    // Services & members
    services,
    members,
    selectedServices,
    selectService: (service: SelectedService) => selectService(service),
    removeService: (serviceId: string) => removeService(serviceId),

    // Openings / time slots
    memberOpenings,
    openingsLoading,
    selectedDate,
    selectDate,
    selectedTime,
    selectedMember,
    selectSlot: (member: MemberOpenings, time: string) =>
      selectSlot(member, time),

    // Next availability
    findNextAvailability,
    nextAvailability,
    nextAvailabilityLoading,
    nextAvailabilityError,
    clearNextAvailability,

    // Booking actions
    ...booking,

    // Global state
    loading: state.loading,
    error: state.error,
  };
}
