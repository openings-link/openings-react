# @openings-link/react-ui

Themed, drop-in React booking widget for the [Openings](https://openings.link)
platform.

Built on
[`@openings-link/react`](https://www.npmjs.com/package/@openings-link/react)
(headless core). Styled with CSS custom properties — no Tailwind, no CSS
modules.

## Install

```bash
npm install @openings-link/react @openings-link/react-ui
```

## Quick Start

```tsx
import { BookingWidget } from "@openings-link/react-ui";

function App() {
  return (
    <BookingWidget
      business="your-business-handle"
      theme={{ accent: "#8B5CF6" }}
      on={{
        onBookingComplete: (result) => {
          console.log("Booked!", result);
        },
      }}
    />
  );
}
```

## CORS and apiBase

BookingWidget defaults to apiBase="https://api.openings.link".

If your frontend runs on a third-party domain, prefer a same-origin proxy route
in your app and point the widget to that proxy:

```tsx
<BookingWidget business="your-business-handle" apiBase="/api/openings" />
```

This is the recommended setup for npm users to avoid browser CORS issues.

Full proxy templates:
https://github.com/openings-link/openings-react/blob/main/docs/proxy-templates.md

## Props

| Prop                    | Type                         | Description                                            |
| ----------------------- | ---------------------------- | ------------------------------------------------------ |
| `business`\*            | `string`                     | Business handle (slug). Required.                      |
| `apiBase`               | `string`                     | API base URL. Defaults to `https://api.openings.link`. |
| `scheduleId`            | `string`                     | Pre-select a schedule (skip location picker).          |
| `memberId`              | `string`                     | Pre-select a staff member (show their availability).   |
| `theme`                 | `BookingTheme`               | Accent color, border radius, font, light/dark mode.    |
| `labels`                | `Partial<BookingLabels>`     | Override any user-facing string for i18n.              |
| `features`              | `BookingFeatures`            | Optional capabilities, such as rescheduling.           |
| `apiClient`             | `ApiClient`                  | Custom API client for testing or mock data.            |
| `on`                    | `OpeningsCallbacks`          | Event callbacks for booking lifecycle.                 |
| `onConsultationRequest` | `(member, services) => void` | Custom handler for consultation services.              |
| `className`             | `string`                     | CSS class for the root container.                      |

## Optional Rescheduling

Rescheduling is disabled by default. Enable it when you want returning customers
with upcoming appointments to choose between booking a new appointment and
rescheduling an existing one:

```tsx
<BookingWidget
  business="your-business-handle"
  features={{ rescheduling: true }}
  on={{
    onRescheduleComplete: (result) => {
      console.log("Rescheduled!", result);
    },
  }}
/>
```

The widget only shows appointment details after the customer verifies with the
reschedule lookup code returned by the Openings API.

## Theme

```ts
{
  accent?: string;      // Primary color (default: "#000000")
  radius?: number;      // Border radius in px (default: 8)
  fontFamily?: string;  // Font family (default: system)
  mode?: "light" | "dark" | "auto";
}
```

All CSS custom properties are prefixed `--openings-*`.

## Live Demo

**[react.openings.link](https://react.openings.link)**

## License

MIT
