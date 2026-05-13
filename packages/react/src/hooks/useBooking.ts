import { useCallback } from "react";
import { useBookingContext } from "../context";
import type { BookingResult, BookingError } from "../types";
import type { AppointmentHistoryResult } from "../api";

type BookingStatus = "idle" | "verifying" | "booking" | "complete" | "error";

type LookupCustomerResult =
  | { phase: "new-customer" }
  | {
      phase: "returning";
      customerId: string;
      hasUpcomingAppointments: boolean;
      verificationPurpose?: string;
    };

interface UseBookingReturn {
  /** Look up phone/email to determine new vs returning customer. Sends verification for new customers. */
  lookupCustomer: () => Promise<LookupCustomerResult>;
  /** Send verification code to phone/email. */
  sendVerification: (opts?: { purpose?: string }) => Promise<void>;
  /** Submit the verification code. */
  verify: (code: string) => Promise<void>;
  /** Fetch appointment details after reschedule lookup verification. */
  fetchVerifiedAppointmentHistory: (
    code: string,
  ) => Promise<AppointmentHistoryResult>;
  /** Create a customer (for new customers). */
  registerCustomer: (input: {
    firstName: string;
    lastName: string;
  }) => Promise<{ customerId: string }>;
  /** Create the appointment. */
  book: (
    verificationCodeOverride?: string,
    customerIdOverride?: string,
  ) => Promise<BookingResult>;
  /** Reschedule a verified appointment into the selected slot. */
  reschedule: (input: {
    appointmentId: string;
    verificationCode: string;
  }) => Promise<BookingResult>;
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
  const { state, dispatch, config, apiClient, callbacks } = useBookingContext();

  const setPhoneNumber = useCallback(
    (phoneNumber: string) => dispatch({ type: "SET_PHONE", phoneNumber }),
    [dispatch],
  );

  const setEmail = useCallback(
    (email: string) => dispatch({ type: "SET_EMAIL", email }),
    [dispatch],
  );

  const sendVerification = useCallback(
    async (opts?: { purpose?: string }) => {
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
          purpose: opts?.purpose,
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

  const lookupCustomer =
    useCallback(async (): Promise<LookupCustomerResult> => {
      if (!state.business) throw new Error("Business not loaded");
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });
      try {
        const phoneNumber = state.phoneNumber.trim();
        const email = state.email.trim();
        const isEmailVerification =
          state.business.verificationMethod === "EMAIL";

        if (phoneNumber || email) {
          const history = isEmailVerification
            ? await apiClient.fetchAppointmentHistoryByEmail(
                email,
                state.business.id,
              )
            : await apiClient.fetchAppointmentHistory(
                phoneNumber,
                state.business.id,
              );
          if (history.customerId) {
            dispatch({
              type: "SET_CUSTOMER_ID",
              customerId: history.customerId,
            });
            dispatch({ type: "SET_VERIFY_PHASE", phase: "returning" });
            callbacks.onVerificationComplete?.(history.customerId);
            return {
              phase: "returning",
              customerId: history.customerId,
              hasUpcomingAppointments: history.hasUpcomingAppointments,
              verificationPurpose: history.verificationPurpose,
            };
          }
        }
        // New customer — send verification code
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
      state.email,
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

        // Only check history if lookupCustomer hasn't already determined the phase
        if (state.verifyPhase === "phone" && state.phoneNumber) {
          const history = await apiClient.fetchAppointmentHistory(
            state.phoneNumber,
            state.business.id,
          );
          if (history.customerId) {
            dispatch({
              type: "SET_CUSTOMER_ID",
              customerId: history.customerId,
            });
            dispatch({ type: "SET_VERIFY_PHASE", phase: "returning" });
            callbacks.onVerificationComplete?.(history.customerId);
          } else {
            dispatch({ type: "SET_VERIFY_PHASE", phase: "new-customer" });
          }
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

  const fetchVerifiedAppointmentHistory = useCallback(
    async (code: string): Promise<AppointmentHistoryResult> => {
      if (!state.business) throw new Error("Business not loaded");
      const phoneNumber = state.phoneNumber.trim();
      const email = state.email.trim();
      if (!phoneNumber && !email) {
        throw new Error("Enter a phone number or email to continue");
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });
      try {
        const history = await apiClient.fetchVerifiedAppointmentHistory({
          businessId: state.business.id,
          phoneNumber: phoneNumber || undefined,
          email: email || undefined,
          code,
        });
        if (history.customerId) {
          dispatch({ type: "SET_CUSTOMER_ID", customerId: history.customerId });
          callbacks.onVerificationComplete?.(history.customerId);
        }
        dispatch({ type: "SET_VERIFICATION_CODE", code });
        return history;
      } catch (err) {
        const error: BookingError = {
          code: "VERIFICATION_FAILED",
          message:
            err instanceof Error
              ? err.message
              : "Failed to verify appointment history",
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
        const customer = await apiClient.createCustomer({
          businessId: state.business.id,
          userId,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: state.phoneNumber,
        });
        dispatch({ type: "SET_CUSTOMER_ID", customerId: customer.customerId });
        dispatch({
          type: "SET_CUSTOMER_NAME",
          firstName: input.firstName,
          lastName: input.lastName,
        });
        callbacks.onVerificationComplete?.(customer.customerId);
        return { customerId: customer.customerId };
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
      apiClient,
      dispatch,
      callbacks,
    ],
  );

  const book = useCallback(
    async (
      verificationCodeOverride?: string,
      customerIdOverride?: string,
    ): Promise<BookingResult> => {
      const effectiveCustomerId = customerIdOverride ?? state.customerId;
      if (
        !state.business ||
        !state.selectedScheduleId ||
        !state.selectedMemberOpenings ||
        !state.selectedTime ||
        !state.selectedDate ||
        !effectiveCustomerId
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
          customerId: effectiveCustomerId,
          teamMemberId: state.selectedMemberOpenings.teamMemberId ?? undefined,
          services: state.selectedServices.map((s) => ({
            id: s.id,
            ...(s.option?.id ? { optionId: s.option.id } : {}),
          })),
          date: state.selectedDate,
          time: state.selectedTime,
          verificationCode: effectiveVerificationCode,
          metadata: {
            ...config.appointmentMetadata,
            source: "openings-react",
          },
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
    [
      state,
      config.appointmentMetadata,
      apiClient,
      dispatch,
      callbacks,
      sendVerification,
    ],
  );

  const reschedule = useCallback(
    async (input: {
      appointmentId: string;
      verificationCode: string;
    }): Promise<BookingResult> => {
      if (
        !state.business ||
        !state.selectedScheduleId ||
        !state.selectedMemberOpenings ||
        !state.selectedTime ||
        !state.selectedDate
      ) {
        throw new Error("Incomplete booking state");
      }

      const appointmentScheduleId =
        state.selectedMemberOpenings.schedule?.id ?? state.selectedScheduleId;

      dispatch({ type: "SET_LOADING", loading: true });
      try {
        const userId =
          state.selectedMemberOpenings.userId ??
          state.selectedMemberOpenings.teamMemberId ??
          "";
        const result = await apiClient.rescheduleAppointment({
          businessId: state.business.id,
          userId,
          scheduleId: appointmentScheduleId,
          rescheduleAppointmentId: input.appointmentId,
          services: state.selectedServices.map((s) => ({
            id: s.id,
            ...(s.option?.id ? { optionId: s.option.id } : {}),
          })),
          date: state.selectedDate,
          time: state.selectedTime,
          verificationCode: input.verificationCode,
          phoneNumber: state.phoneNumber || undefined,
          email: state.email || undefined,
        });
        dispatch({ type: "SET_RESULT", result });
        callbacks.onRescheduleComplete?.(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to reschedule appointment";
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
    [state, apiClient, dispatch, callbacks],
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
    fetchVerifiedAppointmentHistory,
    registerCustomer,
    book,
    reschedule,
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
