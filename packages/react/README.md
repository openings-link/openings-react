# @openings-link/react

Headless React hooks for building booking interfaces with the
[Openings](https://openings.link) platform.

Zero dependencies. React 18+ only.

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
