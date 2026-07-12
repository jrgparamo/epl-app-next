import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";
import Passkey from "next-auth/providers/passkey";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

// Cap: 5 magic-link sends per email address per 15 minutes.
const MAGIC_LINK_MAX = 5;
const MAGIC_LINK_WINDOW_MS = 15 * 60 * 1000;

/**
 * Auth.js v5 configuration.
 *
 * Providers:
 *  - Nodemailer: magic-link sign-in via SMTP.
 *  - Passkey: WebAuthn passwordless sign-in (experimental in v5).
 *
 * Session strategy is "database" because passkeys require it.
 * Custom fields (`displayName`, `isAdmin`) from the `User` model are
 * exposed on the session via the `session` callback so client + server
 * code can read them without hitting the DB again.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        // Enforce a per-email rate limit BEFORE hitting SMTP.
        await enforceRateLimit(
          `magic_link:${email.toLowerCase()}`,
          MAGIC_LINK_MAX,
          MAGIC_LINK_WINDOW_MS,
        );

        const transport = createTransport(provider.server);
        const host = new URL(url).host;
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
          html: renderEmailHtml({ url, host }),
        });
      },
    }),
    Passkey,
  ],
  experimental: { enableWebAuthn: true },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.displayName = user.displayName ?? null;
        session.user.isAdmin = Boolean(user.isAdmin);
      }
      return session;
    },
  },
  pages: {
    // We keep sign-in in the existing modal on the home page; Auth.js still
    // needs a value to route unauthenticated redirects to.
    signIn: "/",
  },
});

function renderEmailHtml({ url, host }) {
  return `
    <body style="background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;">
      <table width="100%" style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 12px 0;font-size:20px;">Sign in to ${host}</h1>
          <p style="margin:0 0 24px 0;color:#444;">Click the button below to sign in. This link expires in 24 hours.</p>
          <p><a href="${url}" style="display:inline-block;background:#00c851;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Sign in</a></p>
          <p style="margin-top:32px;color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </body>
  `;
}
