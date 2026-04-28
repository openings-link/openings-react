const API_BASE = "https://api.openings.link";

/** Only allow proxying to known public API path prefixes. */
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

/** Headers that should NOT be forwarded to the upstream API. */
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

  if (!ALLOWED_PREFIXES.some((p) => joined.startsWith(p))) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const upstream = `${API_BASE}/${joined}${url.search}`;

  // Forward headers, stripping browser-only ones that trigger CORS rejection
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = req.body ? await req.text() : undefined;

  const res = await fetch(upstream, {
    method: req.method,
    headers,
    body,
  });

  const responseBody = await res.text();

  return new Response(responseBody, {
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
