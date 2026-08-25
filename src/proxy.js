import { NextResponse } from "next/server";

// Per-request nonce lets us drop 'unsafe-inline'/'unsafe-eval' from script-src.
// Next.js reads the nonce from the request's CSP header and stamps it onto the
// framework scripts it renders. 'strict-dynamic' then trusts scripts those load.
export function proxy(request) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // React Refresh / HMR needs eval in dev only.
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");
  const connectSrc = ["'self'", ...(isDev ? ["ws:", "wss:"] : [])].join(" ");

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https://lh3.googleusercontent.com https://api.qrserver.com",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "x-middleware-prefetch" },
      ],
    },
  ],
};
