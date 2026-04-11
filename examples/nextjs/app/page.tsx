const CODE_WIDGET = `import { BookingWidget } from "@openings/react-ui";

<BookingWidget
  business="your-business-handle"
  theme={{ accent: "#8B5CF6" }}
  on={{
    onBookingComplete: (result) => {
      console.log("Booked!", result);
    },
  }}
/>`;

const CODE_HEADLESS = `import { OpeningsProvider, useBookingFlow } from "@openings/react";

<OpeningsProvider business="your-business-handle">
  <MyBookingUI />
</OpeningsProvider>

function MyBookingUI() {
  const {
    step,            // schedule | openings | review | verify | confirm | service-request
    schedules,       // available locations
    services,        // filtered by staff in member mode
    members,         // staff for selected schedule
    selectedServices,// user's selected services
    memberOpenings,  // time slots by staff (or by location in staff mode)
    selectSchedule,
    selectService,
    removeService,
    selectSlot,
    goToReview,
    goBack,
    canGoBack,
  } = useBookingFlow();
}`;

const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginTop: 40,
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid #e5e5e5",
};

const h3: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginTop: 28,
  marginBottom: 8,
};

const p: React.CSSProperties = {
  color: "#444",
  lineHeight: 1.7,
  marginBottom: 12,
};

const tree: React.CSSProperties = {
  background: "#f5f5f5",
  borderRadius: 8,
  padding: "16px 20px",
  fontFamily: "monospace",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#333",
  whiteSpace: "pre",
  overflow: "auto",
  margin: "12px 0 16px",
};

const code: React.CSSProperties = {
  background: "#1e1e1e",
  color: "#d4d4d4",
  padding: 20,
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.5,
  overflow: "auto",
  margin: "12px 0",
};

export default function DocsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>@openings/react</h1>
      <p style={{ ...p, fontSize: 17, color: "#666" }}>
        Open-source React library for building booking interfaces with{" "}
        <a href="https://openings.link" style={{ color: "#8B5CF6" }}>
          Openings
        </a>
        .
      </p>

      {/* ── Why Openings ── */}
      <h2 style={h2}>Why Openings?</h2>
      <p style={p}>
        Most booking platforms treat a business as a flat list of time slots.
        That works for a solo freelancer — but falls apart the moment you have
        multiple locations or a team.
      </p>
      <p style={p}>
        Openings is built around the way real service businesses actually work:
      </p>
      <ul style={{ ...p, paddingLeft: 20, lineHeight: 2 }}>
        <li>
          <strong>Business → Schedules → Staff → Services.</strong> A barbershop
          with two studios and five barbers isn&apos;t five independent
          calendars — it&apos;s one business with structure. Openings models
          that structure natively.
        </li>
        <li>
          <strong>One widget, every configuration.</strong> The same{" "}
          <code>&lt;BookingWidget&gt;</code> handles a solo operator, a
          multi-location chain, or a single staff member&apos;s personal booking
          page — controlled entirely by props.
        </li>
        <li>
          <strong>Headless-first.</strong> <code>@openings/react</code> gives
          you hooks and state with zero UI opinions.{" "}
          <code>@openings/react-ui</code> gives you a themed drop-in.
        </li>
      </ul>

      {/* ── Install ── */}
      <h2 style={h2}>Installation</h2>
      <pre style={code}>
        <code>npm install @openings/react @openings/react-ui</code>
      </pre>
      <p style={p}>
        <strong>@openings/react</strong> — Headless hooks, state machine, and
        types. Zero dependencies, React 18+ peer dep only.
      </p>
      <p style={p}>
        <strong>@openings/react-ui</strong> — Themed, drop-in booking components
        built on the headless core. Styled with CSS custom properties (no
        Tailwind, no CSS modules).
      </p>

      {/* ── Quick start ── */}
      <h2 style={h2}>Quick Start</h2>
      <h3 style={h3}>Drop-in Widget</h3>
      <p style={p}>
        One component, one prop. Connect to a live Openings business by its
        handle.
      </p>
      <pre style={code}>
        <code>{CODE_WIDGET}</code>
      </pre>

      <h3 style={h3}>Headless (Custom UI)</h3>
      <p style={p}>
        Use the hooks directly to build any UI. All booking state and actions
        are exposed through <code>useBookingFlow()</code>.
      </p>
      <pre style={code}>
        <code>{CODE_HEADLESS}</code>
      </pre>

      {/* ── Concepts ── */}
      <h2 style={h2}>Booking Layers</h2>
      <p style={p}>
        Openings organizes booking around four layers. Understanding these is
        key to using the library — and what makes Openings powerful for
        multi-location, multi-staff businesses.
      </p>

      <h3 style={h3}>Business</h3>
      <p style={p}>
        The top-level entity. A business has a unique handle (slug) like{" "}
        <code>&quot;demo&quot;</code> and is the only required prop.
      </p>

      <h3 style={h3}>Schedules (Locations)</h3>
      <p style={p}>
        A business has one or more <strong>schedules</strong>. Each schedule is
        a bookable unit — usually a physical location, but it can also be an
        online schedule (no address). A barbershop with two studios has two
        schedules.
      </p>
      <div style={tree}>
        {`Demo Barbershop
├── East Village   (154 Orchard St, New York)
└── SoHo           (129 Grand St, New York)`}
      </div>
      <p style={p}>
        When a business has multiple schedules, the widget shows a{" "}
        <strong>location picker</strong> first. With only one schedule, it skips
        straight to booking.
      </p>

      <h3 style={h3}>Staff (Members)</h3>
      <p style={p}>
        Each schedule has <strong>staff members</strong> assigned to it. A staff
        member can work at multiple locations. When a customer picks a time
        slot, they&apos;re booking with a specific person at a specific place.
      </p>
      <div style={tree}>
        {`East Village          SoHo
├── John ←─────────── John     (works at both)
├── Amy  ←─────────── Amy      (works at both)
└── Noah              ├── Rose
                      └── Natalie`}
      </div>
      <p style={p}>
        <strong>Staff booking mode</strong>: Pass <code>memberId</code> to show
        a specific staff member&apos;s availability across all their locations.
        Only their services are listed, and time slots are grouped by location.
      </p>

      <h3 style={h3}>Services</h3>
      <p style={p}>
        Services belong to the business, but each{" "}
        <strong>staff member offers different services</strong>. A colorist has
        different services than a barber. In location mode the dropdown shows
        all services available there. In staff mode it shows only that
        person&apos;s services.
      </p>
      <div style={tree}>
        {`John's services         Amy's services
├── Short Haircut       ├── Short Haircut
├── Medium Haircut      ├── Medium Haircut
├── Long Haircut        ├── Long Haircut
└── Color               └── Color`}
      </div>

      <h3 style={h3}>How It All Fits Together</h3>
      <div style={tree}>
        {`Business
└── Schedule (location)
    ├── Staff member A
    │   ├── Service 1
    │   └── Service 2
    └── Staff member B
        ├── Service 2
        └── Service 3`}
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          marginTop: 12,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #e5e5e5",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "8px 12px" }}>Entry props</th>
            <th style={{ padding: "8px 12px" }}>Customer sees</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["business only (multi)", "Location → services → date/time → book"],
            ["business only (single)", "Services → date/time → book"],
            [
              "business + memberId",
              "Staff's services → date/time by location → book",
            ],
            [
              "business + scheduleId",
              "Services → date/time → book (location locked)",
            ],
          ].map(([entry, flow]) => (
            <tr key={entry} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td
                style={{
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#666",
                }}
              >
                {entry}
              </td>
              <td style={{ padding: "8px 12px", color: "#444" }}>{flow}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Booking flow ── */}
      <h2 style={h2}>Booking Flow</h2>
      <p style={p}>
        The step machine enforces a linear flow with back navigation:
      </p>
      <div style={tree}>
        {`schedule → openings → review → verify → confirm
                  └→ service-request → confirm`}
      </div>
      <p style={p}>
        <strong>schedule</strong> — pick a location (skipped if one schedule or
        entry prop set).
        <br />
        <strong>openings</strong> — pick service, date, and time slot.
        <br />
        <strong>review</strong> — confirm selection.
        <br />
        <strong>verify</strong> — phone/email lookup. New customers enter name +
        verification code. Returning customers book directly.
        <br />
        <strong>confirm</strong> — booking confirmation.
        <br />
        <strong>service-request</strong> — consultation form with optional photo
        uploads. Triggered by services marked <code>hasConsultation</code>.
      </p>

      {/* ── Props reference ── */}
      <h2 style={h2}>Props Reference</h2>
      <p style={p}>
        All props accepted by <code>&lt;BookingWidget /&gt;</code>:
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          marginTop: 12,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #e5e5e5",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "8px 12px" }}>Prop</th>
            <th style={{ padding: "8px 12px" }}>Type</th>
            <th style={{ padding: "8px 12px" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              [
                "business",
                "string",
                "Required. The business handle (slug) to load. This is the only required prop.",
                true,
              ],
              [
                "apiBase",
                "string",
                'API base URL. Defaults to "https://api.openings.link". Override for self-hosted or staging environments.',
                false,
              ],
              [
                "scheduleId",
                "string",
                "Pre-select a specific schedule. Skips the location picker and jumps straight to service/time selection.",
                false,
              ],
              [
                "memberId",
                "string",
                "Pre-select a specific staff member. Shows only their services and groups time slots by location.",
                false,
              ],
              [
                "theme",
                "BookingTheme",
                "Customize the widget appearance — accent color, border radius, font, and light/dark mode.",
                false,
              ],
              [
                "labels",
                "Partial<BookingLabels>",
                "Override any user-facing string for i18n or custom copy.",
                false,
              ],
              [
                "apiClient",
                "ApiClient",
                "Inject a custom API client. Useful for testing with mock data or wrapping requests.",
                false,
              ],
              [
                "on",
                "OpeningsCallbacks",
                "Event callbacks for booking lifecycle events.",
                false,
              ],
              [
                "onConsultationRequest",
                "(member, services) => void",
                'Called when a user clicks "Send a Request" on a consultation service. If omitted, the built-in service request form is shown.',
                false,
              ],
              [
                "className",
                "string",
                "CSS class name applied to the root container element.",
                false,
              ],
            ] as [string, string, string, boolean][]
          ).map(([prop, type, desc, required]) => (
            <tr key={prop} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td
                style={{
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {prop}
                {required && (
                  <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>
                )}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#8B5CF6",
                  whiteSpace: "nowrap",
                }}
              >
                {type}
              </td>
              <td style={{ padding: "8px 12px", color: "#444" }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={h3}>BookingTheme</h3>
      <pre style={code}>
        <code>{`{
  accent?: string;      // Primary color (default: "#000000")
  radius?: number;      // Border radius in px (default: 8)
  fontFamily?: string;  // Font family (default: system)
  mode?: "light" | "dark" | "auto";
}`}</code>
      </pre>

      <h3 style={h3}>OpeningsCallbacks</h3>
      <pre style={code}>
        <code>{`{
  onBookingComplete?: (result) => void;
  onServiceRequestComplete?: (result) => void;
  onStepChange?: (from, to) => void;
  onError?: (error) => void;
  onScheduleSelect?: (schedule) => void;
  onServiceSelect?: (service) => void;
  onSlotSelect?: (slot) => void;
  onVerificationSent?: (method) => void;
  onVerificationComplete?: (customerId) => void;
  onConsultationRequest?: (request) => void;
}`}</code>
      </pre>

      {/* ── Link to examples ── */}
      <div
        style={{
          marginTop: 48,
          padding: 20,
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 15 }}>
          See live demos →{" "}
          <a href="/examples" style={{ color: "#8B5CF6", fontWeight: 600 }}>
            Examples
          </a>
        </p>
      </div>
    </div>
  );
}
