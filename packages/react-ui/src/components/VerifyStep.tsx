import { useState } from "react";
import {
  formatDuration,
  formatPrice,
  formatTime,
  useBooking,
  useBusiness,
  type AppointmentHistoryItem,
  type BookingFeatures,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";
import { PhoneInput } from "./PhoneInput";

interface Props {
  labels: BookingLabels;
  features?: BookingFeatures;
}

type RescheduleLookup = {
  customerId: string;
  verificationPurpose?: string;
};

type RescheduleMode = "none" | "choice" | "code" | "list";

export function VerifyStep({ labels, features }: Props) {
  const { business } = useBusiness();
  const {
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    lookupCustomer,
    sendVerification,
    fetchVerifiedAppointmentHistory,
    verify,
    registerCustomer,
    verifyPhase,
    book,
    reschedule,
    error,
    verificationSent,
  } = useBooking();

  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState<RescheduleMode>("none");
  const [rescheduleLookup, setRescheduleLookup] =
    useState<RescheduleLookup | null>(null);
  const [rescheduleAppointments, setRescheduleAppointments] = useState<
    AppointmentHistoryItem[]
  >([]);
  const [rescheduleCode, setRescheduleCode] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const isEmailVerification = business?.verificationMethod === "EMAIL";
  const reschedulingEnabled = features?.rescheduling === true;

  const handleLookup = async () => {
    setSubmitting(true);
    setRescheduleError(null);
    try {
      const result = await lookupCustomer();
      if (result.phase === "returning") {
        if (reschedulingEnabled && result.hasUpcomingAppointments) {
          setRescheduleLookup({
            customerId: result.customerId,
            verificationPurpose: result.verificationPurpose,
          });
          setRescheduleMode("choice");
          return;
        }
        await book(undefined, result.customerId);
      }
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndBook = async () => {
    setSubmitting(true);
    try {
      await verify(code);
      const customer = await registerCustomer({ firstName, lastName });
      await book(undefined, customer.customerId);
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleBook = async () => {
    setSubmitting(true);
    try {
      await book();
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAppointment = async () => {
    if (!rescheduleLookup) return;
    setSubmitting(true);
    try {
      await book(undefined, rescheduleLookup.customerId);
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartReschedule = async () => {
    if (!rescheduleLookup?.verificationPurpose) {
      setRescheduleError("Verification is required to reschedule.");
      return;
    }
    setSubmitting(true);
    setRescheduleError(null);
    try {
      await sendVerification({ purpose: rescheduleLookup.verificationPurpose });
      setCode("");
      setRescheduleMode("code");
    } catch (err) {
      setRescheduleError(
        err instanceof Error ? err.message : "Failed to send verification code",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReschedule = async () => {
    setSubmitting(true);
    setRescheduleError(null);
    try {
      const history = await fetchVerifiedAppointmentHistory(code);
      setRescheduleCode(code);
      setRescheduleAppointments(history.upcomingAppointments);
      setRescheduleLookup((prev) => ({
        customerId: history.customerId ?? prev?.customerId ?? "",
        verificationPurpose:
          history.verificationPurpose ?? prev?.verificationPurpose,
      }));
      setRescheduleMode("list");
    } catch (err) {
      setRescheduleError(
        err instanceof Error
          ? err.message
          : "Failed to verify appointment history",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (
    appointment: AppointmentHistoryItem,
  ) => {
    setSubmitting(true);
    try {
      await reschedule({
        appointmentId: appointment.appointmentId,
        verificationCode: rescheduleCode,
      });
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReturningAndBook = async () => {
    setSubmitting(true);
    try {
      // Pass code directly to book — the appointment endpoint verifies it.
      // Do NOT call verify() separately; it consumes the OTP code.
      await book(code);
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid var(--openings-border, #e5e5e5)",
    borderRadius: "var(--openings-radius, 8px)",
    fontFamily: "var(--openings-font, inherit)",
    fontSize: 16,
    color: "var(--openings-text, #111)",
    background: "var(--openings-bg, #fff)",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--openings-muted, #666)",
    marginBottom: 6,
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "var(--openings-accent, #000)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--openings-radius, 8px)",
    cursor: submitting ? "not-allowed" : "pointer",
    fontFamily: "var(--openings-font, inherit)",
    fontSize: 16,
    fontWeight: 600,
    opacity: submitting ? 0.7 : 1,
    transition: "opacity 0.15s ease",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "var(--openings-bg, #fff)",
    color: "var(--openings-text, #111)",
    border: "1px solid var(--openings-border, #e5e5e5)",
  };

  const mutedTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--openings-muted, #666)",
    margin: "0 0 8px",
  };

  const displayedError = rescheduleError ?? error;

  if (rescheduleMode === "choice") {
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {labels.rescheduleChoiceTitle}
          </div>
          <p style={{ ...mutedTextStyle, margin: 0 }}>
            {labels.rescheduleChoicePrompt}
          </p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={handleNewAppointment}
            disabled={submitting}
            style={buttonStyle}
          >
            {submitting ? "Booking…" : labels.rescheduleNewAppointment}
          </button>
          <button
            type="button"
            onClick={handleStartReschedule}
            disabled={submitting || !rescheduleLookup?.verificationPurpose}
            style={secondaryButtonStyle}
          >
            {submitting ? "Sending…" : labels.rescheduleExistingAppointment}
          </button>
        </div>
        {displayedError && (
          <p role="alert" style={{ fontSize: 13, color: "#dc2626" }}>
            {displayedError}
          </p>
        )}
      </div>
    );
  }

  if (rescheduleMode === "code") {
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {labels.rescheduleVerifyTitle}
          </div>
          <p style={{ ...mutedTextStyle, margin: 0 }}>
            {isEmailVerification
              ? "A code was sent to your email"
              : "A code was sent to your phone"}
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Verification code</label>
          <p style={mutedTextStyle}>{labels.rescheduleVerifyPrompt}</p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={8}
            autoComplete="one-time-code"
            style={{
              ...inputStyle,
              letterSpacing: 4,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 600,
              ...(displayedError ? { borderColor: "#dc2626" } : {}),
            }}
          />
          {displayedError && (
            <p
              role="alert"
              style={{ fontSize: 13, color: "#dc2626", margin: "6px 0 0" }}
            >
              {displayedError}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleVerifyReschedule}
          disabled={submitting || code.length < 4}
          style={buttonStyle}
        >
          {submitting ? "Verifying…" : "Continue"}
        </button>
      </div>
    );
  }

  if (rescheduleMode === "list") {
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          {labels.rescheduleListTitle}
        </div>
        {rescheduleAppointments.length === 0 ? (
          <p style={mutedTextStyle}>{labels.rescheduleListEmpty}</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {rescheduleAppointments.map((appointment) => (
              <button
                key={appointment.appointmentId}
                type="button"
                onClick={() => handleConfirmReschedule(appointment)}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--openings-bg, #fff)",
                  color: "var(--openings-text, #111)",
                  border: "1px solid var(--openings-border, #e5e5e5)",
                  borderRadius: "var(--openings-radius, 8px)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  textAlign: "left",
                  fontFamily: "var(--openings-font, inherit)",
                }}
              >
                <span style={{ display: "block", fontWeight: 700 }}>
                  {appointment.formattedDatetime ||
                    `${appointment.date} at ${formatTime(appointment.time)}`}
                </span>
                {appointment.services?.length ? (
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "var(--openings-muted, #666)",
                      marginTop: 4,
                    }}
                  >
                    {appointment.services
                      .map((service) => service.title)
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}
                {(appointment.price || appointment.duration) && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "var(--openings-muted, #666)",
                      marginTop: 4,
                    }}
                  >
                    {appointment.price ? formatPrice(appointment.price) : ""}
                    {appointment.price && appointment.duration ? " · " : ""}
                    {appointment.duration
                      ? formatDuration(appointment.duration)
                      : ""}
                  </span>
                )}
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--openings-accent, #000)",
                    marginTop: 8,
                  }}
                >
                  {labels.rescheduleConfirmButton}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setRescheduleMode("choice")}
          disabled={submitting}
          style={secondaryButtonStyle}
        >
          {labels.back}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Phase 1: Enter phone/email only */}
      {verifyPhase === "phone" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {isEmailVerification ? "Email address" : "Phone number"}
            </label>
            {isEmailVerification ? (
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
            ) : (
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Phone number"
              />
            )}
            {error && (
              <p
                role="alert"
                style={{
                  fontSize: 13,
                  color: "#dc2626",
                  margin: "6px 0 0",
                }}
              >
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLookup}
            disabled={submitting || (!phoneNumber && !email)}
            style={buttonStyle}
          >
            {submitting ? "Checking…" : "Continue"}
          </button>
        </div>
      )}

      {/* Phase 2a: New customer — name + verification code */}
      {verifyPhase === "new-customer" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle}
                autoComplete="given-name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Verification code</label>
            <p
              style={{
                fontSize: 13,
                color: "var(--openings-muted, #666)",
                margin: "0 0 8px",
              }}
            >
              {isEmailVerification
                ? "A code was sent to your email"
                : "A code was sent to your phone"}
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              autoComplete="one-time-code"
              style={{
                ...inputStyle,
                letterSpacing: 4,
                textAlign: "center",
                fontSize: 20,
                fontWeight: 600,
                ...(error ? { borderColor: "#dc2626" } : {}),
              }}
            />
            {error && (
              <p
                role="alert"
                style={{
                  fontSize: 13,
                  color: "#dc2626",
                  margin: "6px 0 0",
                }}
              >
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleVerifyAndBook}
            disabled={submitting || !firstName || !lastName || code.length < 4}
            style={buttonStyle}
          >
            {submitting ? "Booking…" : "Verify & Book"}
          </button>
        </div>
      )}

      {/* Phase 2b: Returning customer — book directly */}
      {verifyPhase === "returning" && (
        <div>
          <div
            style={{
              textAlign: "center",
              padding: "12px 0 20px",
              color: "var(--openings-muted, #666)",
              fontSize: 15,
            }}
          >
            Welcome back! 👋
          </div>

          {verificationSent && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Verification code</label>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--openings-muted, #666)",
                  margin: "0 0 8px",
                }}
              >
                {isEmailVerification
                  ? "A code was sent to your email"
                  : "A code was sent to your phone"}
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
                style={{
                  ...inputStyle,
                  letterSpacing: 4,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  ...(error ? { borderColor: "#dc2626" } : {}),
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={
              verificationSent ? handleVerifyReturningAndBook : handleBook
            }
            disabled={submitting || (verificationSent && code.length < 4)}
            style={buttonStyle}
          >
            {submitting
              ? "Booking…"
              : verificationSent
                ? "Verify & Confirm booking"
                : labels.bookButton}
          </button>
        </div>
      )}
    </div>
  );
}
