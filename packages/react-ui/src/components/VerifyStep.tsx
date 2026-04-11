import { useState } from "react";
import { useBooking, useBusiness } from "@openings-link/react";
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

  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEmailVerification = business?.verificationMethod === "EMAIL";

  const handleLookup = async () => {
    setSubmitting(true);
    try {
      const result = await lookupCustomer();
      if (result.phase === "returning") {
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

  return (
    <div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        {labels.verifyTitle}
      </div>

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
