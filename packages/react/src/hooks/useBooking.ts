import { useCallback } from "react";
import { useBookingContext } from "../context";
import type { BookingResult, BookingError } from "../types";

type BookingStatus = "idle" | "verifying" | "booking" | "complete" | "error";

interface UseBookingReturn {
  /**
   * Probe whether the entered phone number has any upcoming appointments,
   * then route the user into the new-customer or returning-customer flow.
   *
   * For returning customers this triggers the booking OTP automatically
   * (SMS only — email flows still need the email collected first). The
   * full appointment list is NOT fetched — that requires an explicit
   * "manage existing" action via `useAppointmentHistory()`.
   */
  lookupCustomer: () => Promise<
    { phase: "new-customer" } | { phase: "returning" }
  >;
  /** Send verification code to phone/email. */
  sendVerification: () => Promise<void>;
  /** Submit the verification code. */
  verify: (code: string) => Promise<void>;
  /** Create a customer (for new customers). */
  registerCustomer: (input: {
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  /** Create the appointment. */
  book: (
    verificationCodeOverride?: string,
    customerIdOverride?: string,
  ) => Promise<BookingResult>;
  /** Reset the booking flow. */
  reset: () => void;
  status: BookingStatus;
  result: BookingResult | null;
  error: string | null;

  /* Verification state */
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  verificationSent: boolean;
  verifyPhase: "phone" | "new-customer" | "returning";
  customerId: string | null;
}

export function useBooking(): UseBookingReturn {
  const { state, dispatch, apiClient, callbacks } = useBookingContext();

  const setPhoneNumber = useCallback(
    (phoneNumber: string) => dispatch({ type: "SET_PHONE", phoneNumber }),
    [dispatch],
  );

  const setEmail = useCallback(
    (email: string) => dispatch({ type: "SET_EMAIL", email }),
    [dispatch],
  );

  const sendVerification = useCallback(async () => {
    if (!state.business) throw new Error("Business not loaded");
    const phoneNumber = state.phoneNumber.trim();
    const email = state.email.trim();
    if (!phoneNumber && !email) {
      const message = "Enter a phone number or email to continue";
      dispatch({ type: "SET_ERROR", error: message });
      throw new Error(message);
    }
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const result = await apiClient.sendVerification({
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        businessId: state.business.id,
      });
      dispatch({ type: "SET_VERIFICATION_SENT", sent: true });
      callbacks.onVerificationSent?.(
        result.method === "email" ? "EMAIL" : "SMS",
      );
    } catch (err) {
      const error: BookingError = {
        code: "VERIFICATION_FAILED",
        message:
          err instanceof Error ? err.message : "Failed to send verification",
        step: "verify",
        retryable: true,
      };
      dispatch({ type: "SET_ERROR", error: error.message });
      callbacks.onError?.(error);
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [
    state.business,
    state.phoneNumber,
    state.email,
    apiClient,
    dispatch,
    callbacks,
  ]);

  const lookupCustomer = useCallback(async (): Promise<
    { phase: "new-customer" } | { phase: "returning" }
  > => {
    if (!state.business) throw new Error("Business not loaded");
    const businessId = state.business.id;
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      // PII-safe probe: returns only `{ hasUpcomingAppointments }` —
      // no times, no prices, no customerId. The full payload is gated
      // behind the history OTP (see useAppointmentHistory).
      let hasUpcoming = false;
      if (state.phoneNumber) {
        dispatch({ type: "HISTORY_PROBE_STARTED" });
        try {
          const probe = await apiClient.probeAppointmentHistory({
            phoneNumber: state.phoneNumber,
            businessId,
          });
          hasUpcoming = probe.hasUpcomingAppointments;
          dispatch({
            type: "HISTORY_PROBE_SUCCEEDED",
            hasUpcomingAppointments: hasUpcoming,
          });
        } catch {
          dispatch({ type: "HISTORY_PROBE_FAILED" });
          // Fall through — treat as new customer if probe fails.
        }
      }
      if (hasUpcoming) {
        // Probable returning customer. We don't have the customerId
        // (it's behind history OTP) — the appointment-create endpoint
        // resolves the customer server-side from phoneNumber + a valid
        // booking OTP at create time. Auto-send the booking code so the
        // user lands on the code-entry screen.
        dispatch({ type: "SET_VERIFY_PHASE", phase: "returning" });
        if (state.business.verificationMethod !== "EMAIL") {
          await sendVerification();
        }
        return { phase: "returning" };
      }
      // New customer — collect name first; OTP is sent when the user
      // submits the name form (existing UX).
      await sendVerification();
      dispatch({ type: "SET_VERIFY_PHASE", phase: "new-customer" });
      return { phase: "new-customer" };
    } catch (err) {
      const error: BookingError = {
        code: "VERIFICATION_FAILED",
        message:
          err instanceof Error ? err.message : "Failed to look up customer",
        step: "verify",
        retryable: true,
      };
      dispatch({ type: "SET_ERROR", error: error.message });
      callbacks.onError?.(error);
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [
    state.business,
    state.phoneNumber,
    sendVerification,
    apiClient,
    dispatch,
    callbacks,
  ]);

  const verify = useCallback(
    async (code: string) => {
      if (!state.business) throw new Error("Business not loaded");
      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const result = await apiClient.verifyCode({
          phoneNumber: state.phoneNumber || undefined,
          email: state.email || undefined,
          code,
          businessId: state.business.id,
        });
        if (!result.verified) {
          throw new Error("Invalid verification code");
        }
        dispatch({ type: "SET_VERIFICATION_CODE", code });
        // We deliberately do NOT call /appointments/history here. The
        // booking-create endpoint resolves an existing customer from
        // phoneNumber + the verified OTP server-side; pulling the full
        // history (with PII) requires the separate history OTP gate
        // (see useAppointmentHistory). If verifyPhase is still "phone"
        // it means the consumer skipped lookupCustomer — leave it in
        // "new-customer" mode so the existing UI collects a name.
        if (state.verifyPhase === "phone") {
          dispatch({ type: "SET_VERIFY_PHASE", phase: "new-customer" });
        }
      } catch (err) {
        const error: BookingError = {
          code: "VERIFICATION_FAILED",
          message: err instanceof Error ? err.message : "Verification failed",
          step: "verify",
          retryable: true,
        };
        dispatch({ type: "SET_ERROR", error: error.message });
        callbacks.onError?.(error);
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [
      state.business,
      state.phoneNumber,
      state.email,
      apiClient,
      dispatch,
      callbacks,
    ],
  );

  const registerCustomer = useCallback(
    async (input: { firstName: string; lastName: string }) => {
      if (!state.business || !state.selectedMemberOpenings)
        throw new Error("Missing booking context");

      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const userId =
          state.selectedMemberOpenings.userId ??
          state.selectedMemberOpenings.teamMemberId ??
          "";
        // The public /customers/booking endpoint creates the customer
        // record but no longer returns its id (PII reduction). The
        // appointment-create endpoint resolves the customer from
        // phoneNumber + verified OTP at create time — no need to
        // round-trip the id through the client.
        await apiClient.createCustomer({
          businessId: state.business.id,
          userId,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: state.phoneNumber || undefined,
          email: state.email || undefined,
        });
        dispatch({
          type: "SET_CUSTOMER_NAME",
          firstName: input.firstName,
          lastName: input.lastName,
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error:
            err instanceof Error ? err.message : "Failed to create customer",
        });
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [
      state.business,
      state.selectedMemberOpenings,
      state.phoneNumber,
      state.email,
      apiClient,
      dispatch,
    ],
  );

  const book = useCallback(
    async (
      verificationCodeOverride?: string,
      customerIdOverride?: string,
    ): Promise<BookingResult> => {
      const effectiveCustomerId = customerIdOverride ?? state.customerId;
      // customerId is now optional — the server resolves the customer
      // from phoneNumber/email + verified OTP. Require at least one
      // identifier so the book call can succeed.
      const hasIdentifier =
        Boolean(effectiveCustomerId) ||
        Boolean(state.phoneNumber) ||
        Boolean(state.email);
      if (
        !state.business ||
        !state.selectedScheduleId ||
        !state.selectedMemberOpenings ||
        !state.selectedTime ||
        !state.selectedDate ||
        !hasIdentifier
      ) {
        throw new Error("Incomplete booking state");
      }

      const appointmentScheduleId =
        state.selectedMemberOpenings.schedule?.id ?? state.selectedScheduleId;

      const effectiveVerificationCode =
        verificationCodeOverride || state.verificationCode || undefined;

      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const userId =
          state.selectedMemberOpenings.userId ??
          state.selectedMemberOpenings.teamMemberId ??
          "";
        const result = await apiClient.createAppointment({
          businessId: state.business.id,
          userId,
          scheduleId: appointmentScheduleId,
          customerId: effectiveCustomerId ?? undefined,
          phoneNumber: state.phoneNumber || undefined,
          email: state.email || undefined,
          teamMemberId: state.selectedMemberOpenings.teamMemberId ?? undefined,
          services: state.selectedServices.map((s) => ({
            id: s.id,
            ...(s.option?.id ? { optionId: s.option.id } : {}),
          })),
          date: state.selectedDate,
          time: state.selectedTime,
          verificationCode: effectiveVerificationCode,
        });
        dispatch({ type: "SET_RESULT", result });
        callbacks.onBookingComplete?.(result);
        return result;
      } catch (err) {
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? (err as { status?: number }).status
            : undefined;

        if (status === 428) {
          if (!effectiveVerificationCode) {
            try {
              await sendVerification();
            } catch {
              // keep original 428 message if sending fails
            }
          }
          dispatch({ type: "SET_VERIFY_PHASE", phase: "returning" });
          dispatch({ type: "SET_VERIFICATION_SENT", sent: true });
          // Don't set an error message — the code input's red border is enough
          // and the UI already shows "A code was sent to your phone/email".
          callbacks.onError?.({
            code: "VERIFICATION_FAILED",
            message:
              err instanceof Error
                ? err.message
                : "Verification code required to continue booking.",
            step: "verify",
            retryable: true,
          });
          throw err;
        }

        const message =
          err instanceof Error ? err.message : "Failed to create appointment";
        const error: BookingError = {
          code: message.toLowerCase().includes("slot")
            ? "SLOT_TAKEN"
            : "NETWORK",
          message,
          step: "review",
          retryable: true,
        };
        dispatch({ type: "SET_ERROR", error: error.message });
        callbacks.onError?.(error);
        throw err;
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state, apiClient, dispatch, callbacks, sendVerification],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, [dispatch]);

  let status: BookingStatus = "idle";
  if (state.result) status = "complete";
  else if (state.error) status = "error";
  else if (state.loading && state.step === "verify") status = "verifying";
  else if (state.loading && state.step === "review") status = "booking";

  return {
    lookupCustomer,
    sendVerification,
    verify,
    registerCustomer,
    book,
    reset,
    status,
    result: state.result,
    error: state.error,
    phoneNumber: state.phoneNumber,
    setPhoneNumber,
    email: state.email,
    setEmail,
    verificationSent: state.verificationSent,
    verifyPhase: state.verifyPhase,
    customerId: state.customerId,
  };
}
