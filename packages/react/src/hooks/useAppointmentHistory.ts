import { useCallback, useEffect, useRef } from "react";
import { useBookingContext } from "../context";
import type { AppointmentHistoryFullResponse } from "../types";

interface UseAppointmentHistoryReturn {
  /**
   * Probe state. Auto-populated whenever `state.phoneNumber` changes —
   * the probe reveals only `{ hasUpcomingAppointments }` (no PII), so
   * it's safe to fire eagerly.
   */
  probe: {
    status: "idle" | "loading" | "ready" | "error";
    hasUpcomingAppointments: boolean | null;
  };
  /** True once the consumer dispatches MANAGE_EXISTING_CHOSEN. */
  manageExistingChosen: boolean;
  verification: {
    sent: boolean;
    status: "idle" | "verifying" | "verified" | "error";
    error: string | null;
  };
  /** Full payload — populated only after `verify()` succeeds. */
  verifiedHistory: AppointmentHistoryFullResponse | null;

  /**
   * Mark that the consumer chose to manage an existing appointment.
   * No-op if the probe says there are no upcoming appointments.
   * The consumer should follow this with `sendCode()`.
   */
  chooseManageExisting: () => void;
  /**
   * Send the `history:{businessId}` OTP. Lazy-verify: this is the
   * point where verification friction is introduced.
   */
  sendCode: () => Promise<void>;
  /**
   * Submit the OTP and fetch the full history payload. The code is
   * peek-only — it stays alive within its TTL so it can be re-used.
   */
  verify: (code: string) => Promise<AppointmentHistoryFullResponse>;
  /** Clear probe + verification + payload. Useful on flow reset. */
  reset: () => void;
}

/**
 * Lazy-verify appointment history hook.
 *
 * The probe (cheap, PII-safe) auto-runs when a phone is entered; the full
 * payload (PII) is gated behind an explicit `chooseManageExisting()` call
 * followed by `sendCode()` and `verify(code)`. This mirrors the open-service
 * booking protocol's "trust by mandate" idea — full data only after the
 * user proves ownership of the channel.
 */
export function useAppointmentHistory(): UseAppointmentHistoryReturn {
  const { state, dispatch, apiClient } = useBookingContext();
  const lastProbedPhone = useRef<string | null>(null);

  // Auto-probe whenever a phone number is entered (and reset on change).
  useEffect(() => {
    const phone = state.phoneNumber.trim();
    const businessId = state.business?.id;
    if (!phone || !businessId) {
      lastProbedPhone.current = null;
      return;
    }
    if (lastProbedPhone.current === phone) return;
    lastProbedPhone.current = phone;

    let cancelled = false;
    const ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    dispatch({ type: "HISTORY_PROBE_STARTED" });
    apiClient
      .probeAppointmentHistory({
        phoneNumber: phone,
        businessId,
        signal: ctrl?.signal,
      })
      .then((res) => {
        if (cancelled) return;
        dispatch({
          type: "HISTORY_PROBE_SUCCEEDED",
          hasUpcomingAppointments: res.hasUpcomingAppointments,
        });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: "HISTORY_PROBE_FAILED" });
      });

    return () => {
      cancelled = true;
      ctrl?.abort();
    };
  }, [state.phoneNumber, state.business?.id, apiClient, dispatch]);

  const chooseManageExisting = useCallback(() => {
    if (!state.historyProbe.hasUpcomingAppointments) return;
    dispatch({ type: "MANAGE_EXISTING_CHOSEN" });
  }, [state.historyProbe.hasUpcomingAppointments, dispatch]);

  const sendCode = useCallback(async () => {
    if (!state.business) throw new Error("Business not loaded");
    if (!state.phoneNumber)
      throw new Error("Phone number is required to manage existing appointments");
    await apiClient.sendVerification({
      phoneNumber: state.phoneNumber,
      businessId: state.business.id,
      purpose: "history",
    });
    dispatch({ type: "HISTORY_VERIFICATION_SENT" });
  }, [state.business, state.phoneNumber, apiClient, dispatch]);

  const verify = useCallback(
    async (code: string): Promise<AppointmentHistoryFullResponse> => {
      if (!state.business) throw new Error("Business not loaded");
      if (!state.phoneNumber)
        throw new Error("Phone number is required");
      dispatch({ type: "HISTORY_VERIFICATION_STARTED" });
      try {
        const payload = await apiClient.getAppointmentHistory({
          phoneNumber: state.phoneNumber,
          businessId: state.business.id,
          verificationCode: code,
        });
        dispatch({ type: "HISTORY_VERIFICATION_VERIFIED", payload });
        return payload;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Verification failed";
        dispatch({ type: "HISTORY_VERIFICATION_FAILED", error: message });
        throw err;
      }
    },
    [state.business, state.phoneNumber, apiClient, dispatch],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET_HISTORY" });
  }, [dispatch]);

  return {
    probe: state.historyProbe,
    manageExistingChosen: state.manageExistingChosen,
    verification: state.historyVerification,
    verifiedHistory: state.verifiedHistory,
    chooseManageExisting,
    sendCode,
    verify,
    reset,
  };
}
