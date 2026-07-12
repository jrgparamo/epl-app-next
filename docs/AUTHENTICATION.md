# Authentication

This app uses **[Auth.js v5](https://authjs.dev)** (`next-auth@beta`) with the
Prisma adapter. Two passwordless sign-in methods are supported:

- **Magic link** — a one-time sign-in URL is emailed to the user (via SMTP).
- **Passkeys** — WebAuthn credentials registered per device.

There is no password flow. New accounts are created automatically the first
time a user signs in via magic link.

## Environment variables

```env
# Auth.js — generate with: openssl rand -base64 32
AUTH_SECRET=...
# AUTH_URL is auto-detected on Vercel from VERCEL_URL, but it's strongly
# recommended to set it explicitly in production so passkey (WebAuthn)
# origin checks and magic-link callbacks always resolve to your canonical
# domain — not a preview URL. Set to the primary origin, no trailing slash.
AUTH_URL=https://your-domain.com

# SMTP transport for magic-link emails
EMAIL_SERVER=smtp://user:password@smtp.example.com:587
EMAIL_FROM="EPL App <noreply@example.com>"
```

Any transactional email provider works — Resend, Postmark, SendGrid, SES,
Mailgun, or a plain SMTP server. Format the URL as
`smtp://<user>:<password>@<host>:<port>` (use `smtps://` on 465).

### Setting `AUTH_URL` on Vercel

```bash
# Production only — replace with your canonical domain
vercel env add AUTH_URL production
# When prompted, enter: https://your-domain.com

# Optional: also add for preview so preview deployments work
vercel env add AUTH_URL preview
# Enter your preview base or leave the Vercel-generated URL to auto-detect.
```

Or set it via the Vercel dashboard → **Project → Settings → Environment
Variables**. Redeploy after adding.

Rate limiting for magic links is handled in-app (5 sends per email address
per 15 minutes) via the `RateLimit` Prisma table — see
`src/lib/rate-limit.js`.

## Data model

Auth.js stores its state via the Prisma adapter. See `prisma/schema.prisma`:

- `User` — user record. App-specific fields (`displayName`, `isAdmin`) live
  here.
- `Account` / `Session` / `VerificationToken` — Auth.js internal tables.
- `Authenticator` — passkey (WebAuthn) credentials.

Session strategy is `"database"` (required by the passkey provider).

## Server-side usage

Every API route that needs the current user uses the helpers in
`src/lib/auth-helpers.js`:

```js
import { requireUser, requireAdmin, canActAsUser } from "@/lib/auth-helpers";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response; // 401
  // user.id, user.email, user.displayName, user.isAdmin
}
```

- `getSessionUser()` — returns the session user or `null`.
- `requireUser()` — returns 401 if unauthenticated.
- `requireAdmin()` — returns 403 unless `user.isAdmin === true`.
- `isEffectiveAdmin(user)` — true if the user is a global admin OR is
  `isAdmin` on at least one league.
- `canActAsUser(user, targetUserId)` — true when `user` can act on records
  belonging to `targetUserId` (self OR effective admin).

## Client-side usage

Any client component can read the session via `useAuth()`:

```jsx
"use client";
import { useAuth } from "@/app/components/AuthProvider";

export default function Example() {
  const { user, loading, signInWithMagicLink, signInWithPasskey, signOut } =
    useAuth();
  // ...
}
```

Available methods:

- `signInWithMagicLink(email)` — sends the sign-in email via Nodemailer.
- `signInWithPasskey()` — WebAuthn authentication.
- `registerPasskey()` — registers a new passkey for the signed-in user.
- `signOut()` — sign out (no redirect).
- `refreshUser()` — re-fetch the session from the DB.

## Auth.js endpoints

Auth.js exposes standard endpoints under `/api/auth/*`, handled by
`src/app/api/auth/[...nextauth]/route.js`:

- `GET /api/auth/providers`
- `GET /api/auth/csrf`
- `GET /api/auth/session`
- `POST /api/auth/signin/{nodemailer,passkey}`
- `GET /api/auth/callback/{nodemailer,passkey}`
- `POST /api/auth/signout`

The actual config lives in `src/auth.js`.

## Making a user an admin

The `User.isAdmin` column controls global admin. Toggle it via Prisma:

```bash
npx prisma studio
# or
npx prisma db execute --stdin <<< "UPDATE users SET \"isAdmin\" = true WHERE email = 'you@example.com';"
```

## Security notes

- Never commit `.env.local`.
- Rotate `AUTH_SECRET` on production compromise (invalidates all sessions).
- SMTP credentials should be scoped/API-keyed rather than a shared mailbox.
- Passkeys are bound to the origin (`AUTH_URL`) — mismatched origins in prod
  will prevent WebAuthn from working.
