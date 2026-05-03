# @openings-link/react

Headless React hooks for building booking interfaces with the
[Openings](https://openings.link) platform.

Zero dependencies. React 18+ only.

## Migrating from 1.x to 2.0

Version 2.0 changes how appointment history is fetched to close a PII
enumeration oracle in the Openings public API. The unverified history
endpoint now reveals only `{ hasUpcomingAppointments: boolean }` — no
times, prices, durations, or `customerId`. The full payload is gated
behind an explicit ownership-of-phone proof (OTP).

**Before (1.x):**

```ts
const history = await client.fetchAppointmentHistory(phone, businessId);
// → { upcomingAppointments: [...], customerId: "...", needCreditCard }
```

**After (2.0):**

```ts
const probe = await client.probeAppointmentHistory({
  phoneNumber,
  businessId,
});
// → { hasUpcomingAppointments: boolean }

// To see actual appointment details, the user must prove ownership of
// the phone number via OTP:
await client.sendVerification({
  phoneNumber,
  businessId,
  purpose: "history",
});
// User receives SMS, enters code…

const full = await client.getAppointmentHistory({
  phoneNumber,
  businessId,
  verificationCode: code,
});
// → { hasUpcomingAppointments, upcomingAppointments, customerId, needCreditCard }
```

The `<BookingWidget />` component in `@openings-link/react-ui` handles
this flow automatically (lazy-verify: the OTP only fires when the user
clicks "I have an existing appointment"). For new bookings there is
zero added friction — the booking-flow OTP is unchanged.

A new headless hook, `useAppointmentHistory()`, exposes the lazy-verify
state machine for custom UIs:

```ts
const {
  probe, // { status, hasUpcomingAppointments } — auto-runs on phone entry
  chooseManageExisting, // gate: only enabled when probe is true
  sendCode, // sends history:{businessId} OTP
  verify, // submits the code and fetches the full payload
  verifiedHistory, // populated only after a successful verify
} = useAppointmentHistory();
```

### Other API changes

- `apiClient.createCustomer()` no longer returns `customerId`. The
  appointment-create endpoint resolves the customer server-side from the
  verified phone (or email) at booking time.
- `apiClient.createAppointment()` accepts `phoneNumber` / `email` and
  treats `customerId` as optional.
- `apiClient.sendVerification()` and `verifyCode()` accept a `purpose`
  option (`"booking"` (default) or `"history"`).
- `useBooking().lookupCustomer()` returns `{ phase: "new-customer" | "returning" }`
  (the old `customerId` field is gone).

## Install

```bash
npm install @openings-link/react
# or
pnpm add @openings-link/react
```

## Quick Start

```tsx
import { OpeningsProvider, useBookingFlow } from "@openings-link/react";

function App() {
  return (
    <OpeningsProvider
      business="your-business-handle"
      on={{
        onBookingComplete: (result) => {
          console.log("Booked!", result.appointmentId);
        },
      }}
    >
      <BookingFlow />
    </OpeningsProvider>
  );
}

function BookingFlow() {
  const {
    step,
    business,
    schedules,
    selectSchedule,
    services,
    members,
    selectedServices,
    selectService,
    removeService,
    memberOpenings,
    selectedDate,
    selectDate,
    selectSlot,
    goToReview,
    goBack,
    canGoBack,
    book,
    status,
    result,
  } = useBookingFlow();

  // Render your custom UI based on `step`
  // "schedule" → "openings" → "review" → "verify" → "confirm"
  // Services with hasConsultation branch to "service-request" → "confirm"
}
```

## CORS and apiBase

OpeningsProvider defaults to apiBase="https://api.openings.link".

For third-party apps, the recommended production setup is a same-origin proxy in
your app (for example /api/openings/\*) and then:

```tsx
<OpeningsProvider business="your-business-handle" apiBase="/api/openings">
  <BookingFlow />
</OpeningsProvider>
```

This removes browser CORS dependency from your frontend integration and works
reliably across local and production environments.

Full proxy templates:
https://github.com/openings-link/openings-react/blob/main/docs/proxy-templates.md

## Hooks

| Hook                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `useBusiness()`       | Business info (name, logo, timezone)          |
| `useSchedules()`      | List of bookable schedules                    |
| `useServices()`       | Services + team members for selected schedule |
| `useOpenings()`       | Available time slots for date + services      |
| `useBooking()`        | Verification + appointment creation           |
| `useBookingFlow()`    | All-in-one orchestrator                       |
| `useServiceRequest()` | Service request form state + submission       |

## Utilities

```tsx
import { formatTime, formatPrice, formatDuration } from "@openings-link/react";

formatTime("14:30"); // "2:30 pm"
formatPrice(50); // "$50"
formatDuration(90); // "1h 30m"
```

## Custom API Client

For testing or custom authentication, provide your own API client:

```tsx
import { OpeningsProvider, createApiClient } from "@openings-link/react";

const client = createApiClient("https://api.openings.link");

<OpeningsProvider business="my-biz" apiClient={client}>
  ...
</OpeningsProvider>;
```

## License

MIT
