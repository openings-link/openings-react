import { useEffect } from "react";
import { useBookingContext } from "../context";
import type { Schedule } from "../types";

interface UseSchedulesReturn {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  selectSchedule: (scheduleId: string) => void;
  selectedScheduleId: string | null;
}

export function useSchedules(): UseSchedulesReturn {
  const { state, dispatch, apiClient, callbacks } = useBookingContext();

  useEffect(() => {
    if (!state.business || state.schedules != null) return;

    let cancelled = false;
    dispatch({ type: "SET_LOADING", loading: true });

    apiClient
      .fetchSchedules(state.business.id)
      .then((schedules) => {
        if (cancelled) return;
        dispatch({ type: "SET_SCHEDULES", schedules });
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch({
          type: "SET_ERROR",
          error:
            err instanceof Error ? err.message : "Failed to load schedules",
        });
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: "SET_LOADING", loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [state.business, state.schedules?.length, apiClient, dispatch]);

  const selectSchedule = (scheduleId: string) => {
    const schedule = state.schedules?.find((s) => s.id === scheduleId);
    if (schedule) {
      callbacks.onScheduleSelect?.(schedule);
    }

    dispatch({ type: "SET_LOADING", loading: true });
    apiClient
      .fetchScheduleDetail(scheduleId)
      .then((detail) => {
        dispatch({
          type: "SET_SCHEDULE_DETAIL",
          scheduleId,
          members: detail.members,
          services: detail.services,
        });
        dispatch({ type: "SET_STEP", step: "openings" });
      })
      .catch((err) => {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to load schedule",
        });
      })
      .finally(() => {
        dispatch({ type: "SET_LOADING", loading: false });
      });
  };

  return {
    schedules: state.schedules ?? [],
    loading: state.loading,
    error: state.error,
    selectSchedule,
    selectedScheduleId: state.selectedScheduleId,
  };
}
