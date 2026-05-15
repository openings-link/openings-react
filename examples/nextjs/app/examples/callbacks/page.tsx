"use client";

import { useMemo, useState } from "react";
import { BookingWidget, type CompletionMode } from "@openings-link/react-ui";
import type {
  BookingError,
  BookingResult,
  ConsultationRequest,
  MemberOpenings,
  Schedule,
  Service,
  ServiceRequestResult,
  Step,
} from "@openings-link/react";
import { multiLocationClient } from "../../mockClient";

type ModalState = {
  title: string;
  body: string;
};

type EventItem = {
  id: number;
  name: string;
  detail: string;
};

const CODE = `import { useState } from "react";
import { BookingWidget } from "@openings-link/react-ui";

function BookingWithCallbacks() {
  const [modal, setModal] = useState(null);

  const showModal = (title, body) => setModal({ title, body });

  return (
    <>
      <BookingWidget
        business="demo"
        completionMode="external"
        onConsultationRequest={(member, services) => {
          showModal(
            "Consultation request",
            \`Open your own intake flow for \${member.name}.\`,
          );
        }}
        onStaffInfoClick={(member) => {
          showModal("Staff info", \`Open your own profile modal for \${member.name}.\`);
        }}
        on={{
          onBookingComplete: (result) => {
            showModal(
              "Custom confirmation",
              \`Appointment \${result.appointmentId} is booked.\`,
            );
          },
          onRescheduleComplete: (result) => {
            showModal("Rescheduled", \`New time: \${result.date} \${result.time}.\`);
          },
          onServiceRequestComplete: (result) => {
            showModal("Request sent", result.serviceRequestId);
          },
          onStepChange: (from, to) => {
            console.log(\`Step changed from \${from} to \${to}\`);
          },
          onError: (error) => {
            showModal("Booking error", error.message);
          },
          onVerificationSent: (method) => {
            showModal("Verification sent", \`Code sent by \${method}.\`);
          },
          onVerificationComplete: (customerId) => {
            showModal("Customer verified", customerId);
          },
          onScheduleSelect: (schedule) => {
            showModal("Schedule selected", schedule.title);
          },
          onServiceSelect: (service) => {
            showModal("Service selected", service.title);
          },
          onSlotSelect: ({ time, member }) => {
            showModal("Slot selected", \`\${time} with \${member.name}.\`);
          },
        }}
      />
      {modal && <MyModal modal={modal} onClose={() => setModal(null)} />}
    </>
  );
}`;

const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: 20,
  background: "#fff",
};

const button: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  padding: "10px 14px",
};

function describeResult(result: BookingResult) {
  return `${result.appointmentId} on ${result.date} at ${result.time}`;
}

function eventDetail(name: string, detail: string): EventItem {
  return { id: Date.now() + Math.random(), name, detail };
}

function CallbackModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="callback-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0,0,0,0.42)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
          padding: 24,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="callback-modal-title" style={{ margin: "0 0 8px", fontSize: 20 }}>
          {modal.title}
        </h2>
        <p style={{ margin: "0 0 20px", color: "#555", lineHeight: 1.6 }}>
          {modal.body}
        </p>
        <button type="button" onClick={onClose} style={button}>
          Close
        </button>
      </div>
    </div>
  );
}

function CompletionModeComparison({ onOpen }: { onOpen: (modal: ModalState) => void }) {
  const [mode, setMode] = useState<CompletionMode>("inline");

  return (
    <section style={{ ...card, marginTop: 24 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Completion Mode Comparison</h2>
      <p style={{ margin: "0 0 16px", color: "#666", lineHeight: 1.6 }}>
        Inline mode shows the built-in confirmation scene. External mode keeps the
        callback but lets the host app own the confirmation modal or page.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["inline", "external"] as CompletionMode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 999,
              background: mode === value ? "#111827" : "#fff",
              color: mode === value ? "#fff" : "#374151",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 12px",
            }}
          >
            {value === "inline" ? "Inline confirmation" : "External confirmation"}
          </button>
        ))}
      </div>
      <BookingWidget
        key={mode}
        business="demo"
        apiClient={multiLocationClient}
        completionMode={mode}
        appointmentMetadata={{ demo: `completion-${mode}` }}
        theme={{ accent: mode === "inline" ? "#8B5CF6" : "#2563eb", radius: 10 }}
        on={{
          onBookingComplete: (result) => {
            if (mode === "external") {
              onOpen({
                title: "Host confirmation modal",
                body: `The host app received ${describeResult(result)} and can redirect to its own confirmation page.`,
              });
            }
          },
        }}
      />
    </section>
  );
}

function CallbackPlayground({ onOpen }: { onOpen: (modal: ModalState) => void }) {
  const [events, setEvents] = useState<EventItem[]>([]);

  const record = (name: string, detail: string, openModal = true) => {
    setEvents((prev) => [eventDetail(name, detail), ...prev].slice(0, 8));
    if (openModal) {
      onOpen({ title: name, body: detail });
    }
  };

  const callbacks = useMemo(
    () => ({
      onBookingComplete: (result: BookingResult) => {
        record("onBookingComplete", describeResult(result));
      },
      onRescheduleComplete: (result: BookingResult) => {
        record("onRescheduleComplete", describeResult(result));
      },
      onServiceRequestComplete: (result: ServiceRequestResult) => {
        record("onServiceRequestComplete", result.serviceRequestId);
      },
      onStepChange: (from: Step, to: Step) => {
        record("onStepChange", `${from} -> ${to}`, false);
      },
      onError: (error: BookingError) => {
        record("onError", `${error.code}: ${error.message}`);
      },
      onVerificationSent: (method: "SMS" | "EMAIL") => {
        record("onVerificationSent", `Verification code sent by ${method}.`);
      },
      onVerificationComplete: (customerId: string) => {
        record("onVerificationComplete", customerId);
      },
      onScheduleSelect: (schedule: Schedule) => {
        record("onScheduleSelect", schedule.title);
      },
      onServiceSelect: (service: Service) => {
        record("onServiceSelect", service.title);
      },
      onSlotSelect: ({ time, member }: { time: string; member: MemberOpenings }) => {
        record("onSlotSelect", `${time} with ${member.name}.`);
      },
    }),
    [],
  );

  const handleConsultationRequest = (
    member: MemberOpenings,
    requestServices: ConsultationRequest["services"],
  ) => {
    record(
      "onConsultationRequest",
      `Open a custom consultation intake for ${member.name} and ${requestServices.length} selected service.`,
    );
  };

  const handleStaffInfoClick = (member: MemberOpenings) => {
    record("onStaffInfoClick", `Open a host-owned profile modal for ${member.name}.`);
  };

  return (
    <section style={{ ...card, marginTop: 24 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Callback Modal Playground</h2>
      <p style={{ margin: "0 0 16px", color: "#666", lineHeight: 1.6 }}>
        This widget wires every lifecycle callback to a simple host-owned modal.
        Step changes are recorded in the event log so they do not interrupt the flow.
      </p>
      <BookingWidget
        business="demo"
        apiClient={multiLocationClient}
        completionMode="external"
        appointmentMetadata={{ demo: "callbacks" }}
        theme={{ accent: "#0f766e", radius: 10 }}
        features={{ rescheduling: true }}
        on={callbacks}
        onConsultationRequest={handleConsultationRequest}
        onStaffInfoClick={handleStaffInfoClick}
      />
      <div style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Recent callback events</h3>
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            background: "#f9fafb",
            minHeight: 80,
            padding: 12,
          }}
        >
          {events.length === 0 ? (
            <p style={{ margin: 0, color: "#777", fontSize: 13 }}>
              Interact with the widget to see callbacks here.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#444", fontSize: 13, lineHeight: 1.7 }}>
              {events.map((event) => (
                <li key={event.id}>
                  <strong>{event.name}</strong>: {event.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CallbacksPage() {
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <div>
      <h1>Callbacks & Custom Confirmation</h1>
      <p style={{ color: "#666", lineHeight: 1.6, marginBottom: 8 }}>
        Compare built-in confirmation with host-owned confirmation, then try a
        widget where callbacks open simple modals.
      </p>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        The examples use mock data, so no real appointment is created.
      </p>

      <CompletionModeComparison onOpen={setModal} />
      <CallbackPlayground onOpen={setModal} />

      <details style={{ marginTop: 32 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#666",
            marginBottom: 12,
          }}
        >
          React code
        </summary>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: 20,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            overflow: "auto",
          }}
        >
          <code>{CODE}</code>
        </pre>
      </details>

      {modal ? <CallbackModal modal={modal} onClose={() => setModal(null)} /> : null}
    </div>
  );
}
