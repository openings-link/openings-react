# Proxy Templates for Openings React

If your frontend calls https://api.openings.link directly from the browser, CORS
may block requests depending on your domain and environment.

The recommended setup for `@openings-link/react` and `@openings-link/react-ui`
is:

1. Add a same-origin proxy route in your app.
2. Forward allowed Openings API requests server-side.
3. Pass `apiBase="/api/openings"` to `OpeningsProvider` or `BookingWidget`.

This removes browser CORS dependency from your integration and works reliably
for local development and production deployments.

## Minimal safe proxy rules

Keep your proxy intentionally narrow:

1. Only forward the public booking endpoints you actually need.
2. Strip browser-specific headers like `origin`, `referer`, and `host`.
3. Do not forward cookies or private app secrets unless you explicitly intend
   to.
4. Keep the browser-facing path same-origin, such as `/api/openings/*`.

Recommended public prefixes:

```txt
v1/salons
v1/locations
v1/openings
v1/appointments
v1/verifications
v1/customers
v1/service-requests
v1/media
```

## Image uploads and serverless body limits

The consultation/service-request flow POSTs base64-encoded images to
`v1/media/upload-public`. Base64 inflates payloads by roughly 1.37×, so request
size matters when proxying through serverless platforms:

| Platform                      | Default body limit |
| ----------------------------- | ------------------ |
| Vercel Serverless Functions   | 4.5 MB             |
| Vercel Edge Functions         | 4 MB               |
| Netlify Functions             | 6 MB               |
| AWS API Gateway               | 10 MB              |
| Cloudflare Workers            | 100 MB             |

The `@openings-link/react-ui` consultation form automatically downscales and
recompresses JPEG/PNG/WebP images in the browser before upload (longest edge
≤ 2048px, JPEG quality stepped down until the result fits ~2.5 MB). This lets
users attach phone photos of any size without hitting these limits. Animated
GIFs and HEIC/HEIF files pass through unchanged — most browsers convert HEIC
to JPEG at the file picker, but if you serve customers on a platform that
doesn't, consider rejecting HEIC server-side.

## Using the proxy from Openings React

Headless package:

```tsx
<OpeningsProvider business="your-business-handle" apiBase="/api/openings">
  <BookingFlow />
</OpeningsProvider>
```

UI package:

```tsx
<BookingWidget business="your-business-handle" apiBase="/api/openings" />
```

## Next.js App Router

Create `app/api/openings/[...path]/route.ts`:

```ts
const API_BASE = "https://api.openings.link";

const ALLOWED_PREFIXES = [
  "v1/salons",
  "v1/locations",
  "v1/openings",
  "v1/appointments",
  "v1/verifications",
  "v1/customers",
  "v1/service-requests",
  "v1/media",
];

const STRIP_HEADERS = new Set([
  "host",
  "origin",
  "referer",
  "connection",
  "accept-encoding",
]);

async function handler(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const joined = path.join("/");

  if (!ALLOWED_PREFIXES.some((prefix) => joined.startsWith(prefix))) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const upstream = `${API_BASE}/${joined}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.text();

  const res = await fetch(upstream, {
    method: req.method,
    headers,
    body,
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
```

## Remix

Create a route such as `app/routes/api.openings.$.ts`:

```ts
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

const API_BASE = "https://api.openings.link";
const ALLOWED_PREFIXES = [
  "v1/salons",
  "v1/locations",
  "v1/openings",
  "v1/appointments",
  "v1/verifications",
  "v1/customers",
  "v1/service-requests",
  "v1/media",
];

async function proxy(request: Request, path: string) {
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const upstream = `${API_BASE}/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("connection");

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(upstream, init);
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  return proxy(request, params["*"] ?? "");
}

export async function action({ request, params }: ActionFunctionArgs) {
  return proxy(request, params["*"] ?? "");
}
```

## Express

```ts
import express from "express";

const app = express();
const API_BASE = "https://api.openings.link";
const ALLOWED_PREFIXES = [
  "v1/salons",
  "v1/locations",
  "v1/openings",
  "v1/appointments",
  "v1/verifications",
  "v1/customers",
  "v1/service-requests",
  "v1/media",
];

app.use("/api/openings", express.text({ type: "*/*" }));

app.all("/api/openings/*", async (req, res) => {
  const path = req.params[0];
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    res.status(404).send("Not found");
    return;
  }

  const search = req.url.includes("?")
    ? req.url.slice(req.url.indexOf("?"))
    : "";
  const upstream = `${API_BASE}/${path}${search}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (["host", "origin", "referer", "connection"].includes(lower)) {
      continue;
    }
    headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  const upstreamRes = await fetch(upstream, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
  });

  res.status(upstreamRes.status);
  res.setHeader(
    "content-type",
    upstreamRes.headers.get("content-type") ?? "application/json",
  );
  res.send(await upstreamRes.text());
});
```

## When direct API access is acceptable

You can point `apiBase` directly at `https://api.openings.link` if your domain
is already allowed by the API CORS policy. For general-purpose npm consumers,
the same-origin proxy remains the safer default.
