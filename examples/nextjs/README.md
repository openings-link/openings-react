# Next.js Example

This app demonstrates `@openings-link/react` and `@openings-link/react-ui` in a
Next.js App Router project.

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3100.

## CORS-safe API usage

For real Openings API calls, use the same-origin proxy route in this example:

- Proxy route: `app/api/proxy/[...path]/route.ts`
- Browser-facing base path: `/api/proxy`

Pass that path to Openings React:

```tsx
import { BookingWidget } from "@openings-link/react-ui";

<BookingWidget business="your-business-handle" apiBase="/api/proxy" />;
```

Headless usage:

```tsx
import { OpeningsProvider } from "@openings-link/react";

<OpeningsProvider business="your-business-handle" apiBase="/api/proxy">
  <YourBookingUI />
</OpeningsProvider>;
```

## Why proxy is recommended

Direct browser requests to `https://api.openings.link` can fail due to CORS,
especially on local development or non-allowlisted domains. A same-origin proxy
avoids that class of failures.

For full production templates, see
https://github.com/openings-link/openings-react/blob/main/docs/proxy-templates.md.
