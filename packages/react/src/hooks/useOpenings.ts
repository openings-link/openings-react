import { useEffect, useCallback } from "react";
import { useBookingContext } from "../context";
import type { MemberOpenings } from "../types";

interface UseOpeningsReturn {
  memberOpenings: MemberOpenings[];
  loading: boolean;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedMember: MemberOpenings | null;
  selectDate: (date: string) => void;
  selectSlot: (member: MemberOpenings, time: string) => void;
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

  return {
    memberOpenings: state.memberOpenings,
    loading: state.openingsLoading,
    selectedDate: state.selectedDate,
    selectedTime: state.selectedTime,
    selectedMember: state.selectedMemberOpenings,
    selectDate,
    selectSlot,
  };
}
