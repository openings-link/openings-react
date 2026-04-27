import { useEffect, useCallback } from "react";
import { useBookingContext } from "../context";
import type { MemberOpenings, NextAvailabilityItem } from "../types";

interface UseOpeningsReturn {
  memberOpenings: MemberOpenings[];
  loading: boolean;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedMember: MemberOpenings | null;
  selectDate: (date: string) => void;
  selectSlot: (member: MemberOpenings, time: string) => void;
  /** Forward-search next available days. Results land in `nextAvailability`. */
  findNextAvailability: (opts?: { days?: number }) => Promise<void>;
  nextAvailability: NextAvailabilityItem[];
  nextAvailabilityLoading: boolean;
  nextAvailabilityError: string | null;
  clearNextAvailability: () => void;
}

export function useOpenings(): UseOpeningsReturn {
  const { state, dispatch, apiClient, callbacks } = useBookingContext();

  const selectDate = useCallback(
    (date: string) => {
      dispatch({ type: "SELECT_DATE", date });
    },
    [dispatch],
  );

  // Fetch openings when date + services are selected
  useEffect(() => {
    if (
      !state.business ||
      !state.selectedDate ||
      state.selectedServices.length === 0
    ) {
      return;
    }

    const servicePayload = state.selectedServices.map((s) => ({
      serviceId: s.id,
      ...(s.option?.id ? { optionId: s.option.id } : {}),
    }));

    let cancelled = false;
    dispatch({ type: "SET_OPENINGS_LOADING", loading: true });

    // Member entry mode: fetch across ALL schedules, filter to selected member
    if (
      state.selectedMemberId &&
      state.schedules &&
      state.schedules.length > 0
    ) {
      const member = state.members.find((m) => m.id === state.selectedMemberId);
      const matchMember = (o: MemberOpenings) =>
        (member?.teamMemberId && o.teamMemberId === member.teamMemberId) ||
        (member?.userId && o.userId === member.userId) ||
        o.username === state.selectedMemberId;

      Promise.all(
        state.schedules!.map((schedule) =>
          apiClient.fetchMemberOpenings(
            state.business!.id,
            schedule.id,
            state.selectedDate!,
            servicePayload,
          ),
        ),
      )
        .then((results) => {
          if (cancelled) return;
          const merged = results.flatMap((r) => r.filter(matchMember));
          dispatch({ type: "SET_MEMBER_OPENINGS", memberOpenings: merged });
        })
        .catch((err) => {
          if (cancelled) return;
          dispatch({
            type: "SET_ERROR",
            error:
              err instanceof Error
                ? err.message
                : "Failed to load availability",
          });
        })
        .finally(() => {
          if (!cancelled)
            dispatch({ type: "SET_OPENINGS_LOADING", loading: false });
        });

      return () => {
        cancelled = true;
      };
    }

    // Normal mode: single schedule
    if (!state.selectedScheduleId) return;

    apiClient
      .fetchMemberOpenings(
        state.business.id,
        state.selectedScheduleId,
        state.selectedDate,
        servicePayload,
      )
      .then((openings) => {
        if (cancelled) return;
        dispatch({ type: "SET_MEMBER_OPENINGS", memberOpenings: openings });
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch({
          type: "SET_ERROR",
          error:
            err instanceof Error ? err.message : "Failed to load availability",
        });
      })
      .finally(() => {
        if (!cancelled)
          dispatch({ type: "SET_OPENINGS_LOADING", loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [
    state.business,
    state.selectedScheduleId,
    state.selectedMemberId,
    state.schedules,
    state.members,
    state.selectedDate,
    state.selectedServices,
    apiClient,
    dispatch,
  ]);

  const selectSlot = useCallback(
    (member: MemberOpenings, time: string) => {
      callbacks.onSlotSelect?.({ time, member });
      dispatch({
        type: "SELECT_SLOT",
        memberOpenings: member,
        time,
      });
    },
    [dispatch, callbacks],
  );

  const findNextAvailability = useCallback(
    async (opts?: { days?: number }) => {
      if (!state.business) return;

      // Determine schedules to search. In member mode we span all schedules
      // the member belongs to; otherwise the currently-selected schedule.
      const scheduleIds = state.selectedMemberId
        ? (state.schedules ?? []).map((s) => s.id)
        : state.selectedScheduleId
          ? [state.selectedScheduleId]
          : [];
      if (scheduleIds.length === 0) return;

      // In member mode, resolve the team-member id so the API can compute
      // openings against the member's per-member child schedules instead of
      // falling back to the business schedule's default hours.
      const teamMemberId = state.selectedMemberId
        ? (state.members.find((m) => m.id === state.selectedMemberId)
            ?.teamMemberId ?? undefined)
        : undefined;

      const totalDuration = state.selectedServices.reduce(
        (sum, s) => sum + (s.option?.duration ?? s.duration),
        0,
      );
      if (totalDuration <= 0) return;

      // Start search from the day AFTER the currently-selected date so we
      // don't return the empty current day.
      const startDate = (() => {
        const base = state.selectedDate
          ? new Date(state.selectedDate + "T00:00:00")
          : new Date();
        base.setDate(base.getDate() + 1);
        const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
        return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
      })();

      dispatch({ type: "SET_NEXT_AVAILABILITY_LOADING", loading: true });
      try {
        const items = await apiClient.fetchNextAvailability({
          businessId: state.business.id,
          scheduleIds,
          teamMemberId,
          date: startDate,
          serviceDuration: totalDuration,
          days: opts?.days,
        });
        // In member mode, filter results to the selected member's schedules
        // (next-availability is schedule-level, not member-level — schedules
        // already correspond to the member, so this is a no-op safety net).
        dispatch({ type: "SET_NEXT_AVAILABILITY", items });
      } catch (err) {
        dispatch({
          type: "SET_NEXT_AVAILABILITY",
          items: [],
          error:
            err instanceof Error
              ? err.message
              : "Failed to find next availability",
        });
      } finally {
        dispatch({ type: "SET_NEXT_AVAILABILITY_LOADING", loading: false });
      }
    },
    [
      apiClient,
      dispatch,
      state.business,
      state.members,
      state.schedules,
      state.selectedDate,
      state.selectedMemberId,
      state.selectedScheduleId,
      state.selectedServices,
    ],
  );

  const clearNextAvailability = useCallback(() => {
    dispatch({ type: "CLEAR_NEXT_AVAILABILITY" });
  }, [dispatch]);

  return {
    memberOpenings: state.memberOpenings,
    loading: state.openingsLoading,
    selectedDate: state.selectedDate,
    selectedTime: state.selectedTime,
    selectedMember: state.selectedMemberOpenings,
    selectDate,
    selectSlot,
    findNextAvailability,
    nextAvailability: state.nextAvailability,
    nextAvailabilityLoading: state.nextAvailabilityLoading,
    nextAvailabilityError: state.nextAvailabilityError,
    clearNextAvailability,
  };
}
