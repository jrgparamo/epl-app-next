# 🚀 Quick Start Guide - API Setup

## Step 1: Get Your Free API Key

1. **Visit Football Data API**
   - Go to https://www.football-data.org/client/register
   - It's completely free for Premier League data!

2. **Sign Up**
   - Create your free account
   - No credit card required

3. **Get Your API Key**
   - After signing up, you'll see your API key in the dashboard
   - Copy this key - you'll need it in the next step

## Step 2: Configure Your App

1. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

2. **Add Your API Key**
   Open `.env.local` and replace `your_api_key_here` with your actual API key:

   ```
   NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_actual_api_key_here
   ```

3. **Start the App**
   ```bash
   npm run dev
   ```

## That's It! 🎉

Your app will now fetch real Premier League data including:

- ✅ Live fixtures and results
- ✅ Current matchday information
- ✅ Team information and logos
- ✅ Match schedules and statuses

## What You Get With The Free API

- **10 requests per minute** (plenty for personal use)
- **Premier League data** (all fixtures, results, standings)
- **Real-time updates** during match days
- **Historical data** for past matches
- **Team information** and statistics

## Troubleshooting

**If you see an error about API key:**

1. Make sure your `.env.local` file exists
2. Check that your API key is correct
3. Restart the development server (`npm run dev`)

**If no matches appear:**

- The API might be temporarily unavailable
- Check your internet connection
- Verify your API key is valid

## Need Help?

- 📖 [Football Data API Docs](https://www.football-data.org/documentation/quickstart)
- 💬 Check the console for error messages
- 🔄 Try refreshing the page

---

**Pro Tip**: The free tier gives you everything you need for this prediction app. You can always upgrade later if you need more requests or additional leagues!

## Step 3: Database (Prisma Postgres via Vercel)

The app uses **Prisma** as the ORM against a Postgres database. The recommended
provisioning path is the [Prisma integration on the Vercel Marketplace](https://vercel.com/marketplace/prisma).

1. Install the Prisma integration from the Vercel Marketplace (once).
2. Link this repo to your Vercel project:
   ```bash
   vercel link
   ```
3. Pull the connection string into `.env.local`:
   ```bash
   vercel env pull .env.local
   ```
   This sets `DATABASE_URL` (and any related vars).
4. Apply the schema:
   ```bash
   npx prisma migrate deploy   # production
   # or during development:
   npx prisma migrate dev
   ```
5. (Optional) Browse data:
   ```bash
   npx prisma studio
   ```

Any Postgres URL works if you'd rather self-host — set `DATABASE_URL`
manually. Prisma 7 requires the `@prisma/adapter-pg` driver adapter, which is
already wired in `src/lib/prisma.js`.

## Step 4: Authentication (Auth.js)

Sign-in uses passwordless magic-link email + passkeys. See
[docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for the full guide. Minimum
env vars to add to `.env.local`:

```env
AUTH_SECRET=<openssl rand -base64 32>
EMAIL_SERVER=smtp://user:password@smtp.example.com:587
EMAIL_FROM="EPL App <noreply@example.com>"
```

Real magic-link delivery requires an SMTP provider (Resend, Postmark,
SendGrid, SES, …). Passkeys work without any email configured.
