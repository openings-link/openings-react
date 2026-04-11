# Openings React

Open-source React library for building booking interfaces with
[Openings](https://www.openings.link).

**[Live demo → react.openings.link](https://react.openings.link)**

## Why Openings?

Most booking platforms treat a business as a flat list of time slots. That works
for a solo freelancer — but falls apart the moment you have multiple locations
or a team.

Openings is built around the way real service businesses actually work:

- **Business → Schedules → Staff → Services.** A barbershop with two studios and
  five barbers isn't five independent calendars — it's one business with
  structure. Openings models that structure natively, so the booking UI adapts
  automatically: multi-location picker, per-staff availability, per-member
  service menus.
- **One widget, every configuration.** The same `<BookingWidget>` handles a solo
  operator (one schedule, one member), a multi-location chain, or a single staff
  member's personal booking page — controlled entirely by props.
- **Headless-first.** `@openings-link/react` gives you hooks and state with zero UI
  opinions. `@openings-link/react-ui` gives you a themed drop-in. Use either, or
  both.

## Packages

| Package                                   | Description                          | Size   |
| ----------------------------------------- | ------------------------------------ | ------ |
| [`@openings-link/react`](packages/react)       | Headless hooks, state machine, types | <5 KB  |
| [`@openings-link/react-ui`](packages/react-ui) | Themed, drop-in booking components   | ~15 KB |

## Core Concepts

Openings organizes booking around four layers. Understanding these is key to
using the library effectively.

### Business

The top-level entity. A business has a unique **handle** (slug) like `"demo"`
and represents one organization on the Openings platform.

```tsx
<BookingWidget business="demo" />
```

### Schedules (Locations)

A business has one or more **schedules**. Each schedule represents a bookable
location (or an online schedule with no address). A barbershop with two physical
studios has two schedules.

```
Demo Barbershop
├── East Village   ← schedule (address: 154 Orchard St, New York)
└── SoHo           ← schedule (address: 129 Grand St, New York)
```

When a business has **multiple schedules**, the widget shows a location picker
first. When there's **only one**, it skips straight to booking.

### Staff (Members)

Each schedule has **staff members** assigned to it. A staff member can work at
multiple locations. When a customer picks a time slot, they're booking with a
specific staff member at a specific location.

```
East Village          SoHo
├── John ←─────────── John     (works at both)
├── Amy  ←─────────── Amy      (works at both)
└── Noah              ├── Rose
                      └── Natalie
```

**Staff booking mode**: Pass `memberId` to show a specific staff member's
availability across all their locations. Only their services are shown, and time
slots are grouped by location instead of by staff member.

```tsx
<BookingWidget business="demo" memberId="mem_john" />
```

### Services

Services belong to the business but each **staff member offers different
services**. A colorist has different services than a barber. When browsing by
location, the service dropdown shows all services available there. In staff
booking mode, it shows only that staff member's services.

```
John's services             Amy's services
├── Short Haircut           ├── Short Haircut
├── Medium Haircut          ├── Medium Haircut
├── Long Haircut            ├── Long Haircut
└── Color                   └── Color
```

### How It All Fits Together

```
Business
└── Schedule (location)
    ├── Staff member A
    │   ├── Service 1
    │   └── Service 2
    └── Staff member B
        ├── Service 2
        └── Service 3
```

The booking flow adapts based on what entry point you configure:

| Entry                        | What the customer sees                               |
| ---------------------------- | ---------------------------------------------------- |
| `business` only              | Location picker → services → date/time → book        |
| `business` (single schedule) | Services → date/time → book (location auto-selected) |
| `business` + `memberId`      | Staff's services → date/time by location → book      |
| `business` + `scheduleId`    | Services → date/time → book (location pre-selected)  |

## Quick Start

```bash
npm install @openings-link/react @openings-link/react-ui
```

### Drop-in Widget

```tsx
import { BookingWidget } from "@openings-link/react-ui";

function App() {
  return (
    <BookingWidget
      business="your-business"
      theme={{ accent: "#8B5CF6" }}
      on={{ onBookingComplete: (r) => console.log("Booked!", r) }}
    />
  );
}
```

### Staff Booking

```tsx
<BookingWidget
  business="your-business"
  memberId="mem_john"
  theme={{ accent: "#dc2626" }}
/>
```

### Headless (Build Your Own UI)

```tsx
import { OpeningsProvider, useBookingFlow } from "@openings-link/react";

function App() {
  return (
    <OpeningsProvider business="your-business">
      <MyCustomBookingUI />
    </OpeningsProvider>
  );
}

function MyCustomBookingUI() {
  const {
    step, // schedule | openings | review | verify | confirm | service-request
    schedules, // available locations
    services, // services (filtered by member if in staff mode)
    members, // staff members for selected schedule
    selectedServices, // user's selected services
    memberOpenings, // time slots grouped by staff (or by location in staff mode)
    selectSchedule,
    selectService,
    removeService,
    selectDate,
    selectSlot,
    goToReview,
    goBack,
    canGoBack,
  } = useBookingFlow();

  // Build any UI you want with the booking state
}
```

## Examples

Or run locally:

```bash
cd examples/nextjs
pnpm install
pnpm dev         # http://localhost:3100
```

| Page                        | Scenario                                                 |
| --------------------------- | -------------------------------------------------------- |
| `/`                         | Documentation — concepts, props reference, code snippets |
| `/examples`                 | Example index                                            |
| `/examples/multi-location`  | Multi-location — customer picks from 2 locations         |
| `/examples/single-location` | Single location — skips the location step                |
| `/examples/staff`           | Staff booking — specific member's availability only      |

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

## Booking Flow

The step machine enforces a linear flow with back navigation:

```
schedule → openings → review → verify → confirm
                  └→ service-request → confirm
```

Services marked `hasConsultation` trigger a **service request** branch instead
of the standard booking flow. The customer fills out a form (with optional photo
uploads) and the request is sent to the staff member.

## Requirements

- React 18+
- An [Openings](https://openings.link) business account

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

## License

MIT
