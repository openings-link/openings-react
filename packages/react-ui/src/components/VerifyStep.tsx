import { useState } from "react";
import {
  useBooking,
  useBusiness,
  useAppointmentHistory,
  formatTime,
  formatPrice,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";
import { PhoneInput } from "./PhoneInput";

interface Props {
  labels: BookingLabels;
}

export function VerifyStep({ labels }: Props) {
  const { business } = useBusiness();
  const {
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    lookupCustomer,
    verify,
    registerCustomer,
    verifyPhase,
    book,
    error,
    verificationSent,
  } = useBooking();
  const history = useAppointmentHistory();

  const [code, setCode] = useState("");
  const [historyCode, setHistoryCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEmailVerification = business?.verificationMethod === "EMAIL";

  const handleLookup = async () => {
    setSubmitting(true);
    try {
      // 2.0: lookupCustomer no longer returns a customerId — the booking
      // OTP is auto-sent for returning customers (SMS) and the existing
      // returning + verificationSent branch collects the code.
      await lookupCustomer();
    } catch {
      // error is dispatched to state
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageExisting = async () => {
    setSubmitting(true);
    try {
      history.chooseManageExisting();
      await history.sendCode();
    } catch {
      // history.verification.error reflects the failure
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyHistory = async () => {
    setSubmitting(true);
    try {
      await history.verify(historyCode);
    } catch {
      // status reflects the failure
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndBook = async () => {
    setSubmitting(true);
    try {
      await verify(code);
      await registerCustomer({ firstName, lastName });
      await book();
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
    width: "100%",
    padding: "12px 16px",
    background: "transparent",
    color: "var(--openings-text, #111)",
    border: "1px solid var(--openings-border, #e5e5e5)",
    borderRadius: "var(--openings-radius, 8px)",
    cursor: submitting ? "not-allowed" : "pointer",
    fontFamily: "var(--openings-font, inherit)",
    fontSize: 14,
    fontWeight: 500,
    marginTop: 10,
    transition: "background 0.15s ease",
  };

  /* History (manage-existing) flow takes over the step UI when chosen. */
  if (history.manageExistingChosen) {
    if (history.verifiedHistory) {
      const appts = history.verifiedHistory.upcomingAppointments;
      return (
        <div>
          <div style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>
            Your upcoming appointments
          </div>
          {appts.length === 0 ? (
            <p style={{ color: "var(--openings-muted, #666)", fontSize: 14 }}>
              No upcoming appointments found.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {appts.map((a) => (
                <li
                  key={a.id}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--openings-border, #e5e5e5)",
                    borderRadius: "var(--openings-radius, 8px)",
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{a.formattedDatetime}</div>
                  <div
                    style={{
                      color: "var(--openings-muted, #666)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {formatTime(a.time)}
                    {typeof a.duration === "number"
                      ? ` · ${a.duration} min`
                      : ""}
                    {typeof a.price === "number"
                      ? ` · ${formatPrice(a.price)}`
                      : ""}
                    {a.isCanceled ? " · Canceled" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p
            style={{
              color: "var(--openings-muted, #666)",
              fontSize: 12,
              marginTop: 12,
              lineHeight: 1.4,
            }}
          >
            To reschedule or cancel, contact the business directly. The
            headless <code>useBooking()</code> hook in
            <code> @openings-link/react </code>
            exposes the underlying endpoints for custom UIs.
          </p>
          <button
            type="button"
            onClick={() => {
              history.reset();
              setHistoryCode("");
            }}
            style={secondaryButtonStyle}
            disabled={submitting}
          >
            Back to booking
          </button>
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Verification code</label>
          <p
            style={{
              fontSize: 13,
              color: "var(--openings-muted, #666)",
              margin: "0 0 8px",
            }}
          >
            A code was sent to your phone. Enter it to view your upcoming
            appointments.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={historyCode}
            onChange={(e) => setHistoryCode(e.target.value)}
            maxLength={6}
            autoComplete="one-time-code"
            style={{
              ...inputStyle,
              letterSpacing: 4,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 600,
              ...(history.verification.error
                ? { borderColor: "#dc2626" }
                : {}),
            }}
          />
          {history.verification.error && (
            <p
              role="alert"
              style={{
                fontSize: 13,
                color: "#dc2626",
                margin: "6px 0 0",
              }}
            >
              {history.verification.error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleVerifyHistory}
          disabled={submitting || historyCode.length < 4}
          style={buttonStyle}
        >
          {submitting ? "Verifying…" : "Verify & view appointments"}
        </button>
        <button
          type="button"
          onClick={() => {
            history.reset();
            setHistoryCode("");
          }}
          style={secondaryButtonStyle}
          disabled={submitting}
        >
          Cancel
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
          {/*
            Lazy-verify "manage existing" affordance.
            Only shown when the PII-safe probe says there ARE upcoming
            appointments — keeps friction to zero for new bookings.
          */}
          {!isEmailVerification &&
            history.probe.hasUpcomingAppointments === true && (
              <button
                type="button"
                onClick={handleManageExisting}
                disabled={submitting}
                style={secondaryButtonStyle}
              >
                I have an existing appointment
              </button>
            )}
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
