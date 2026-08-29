# EPL Prediction App

A modern Next.js application for predicting English Premier League match results, built with real-time data from the Football Data API.

## Features

- 🏆 **Real Premier League Data**: Live fixtures, results, and standings from Football Data API
- 🎯 **Match Predictions**: Make score predictions on upcoming matches with points scoring system
- 🔐 **User Authentication**: Passwordless sign-in via magic-link email and passkeys (Auth.js v5)
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Real-time Updates**: Live match status and score updates
- 🎨 **Modern UI**: Dark theme with Tailwind CSS
- 📊 **Matchday Navigation**: Browse all 38 Premier League matchdays
- 💾 **Offline Support**: Predictions saved locally and synced when online
- 🔄 **Smart Caching**: Intelligent API caching for better performance
- 📈 **Prediction Scoring**: Points system for correct results (1pt) and exact scores (3pts)
- 🔁 **Background Sync**: Automatic retry and sync of failed predictions
- 🌐 **Connection Awareness**: Visual indicators for online/offline status

## API Integration

This app uses the **Football-Data.org API** for Premier League data:

### Why Football-Data.org?

- ✅ **Free Tier Available**: 10 requests per minute
- ✅ **Premier League Included**: Free access to EPL fixtures, results, standings
- ✅ **Reliable & Updated**: Official data source
- ✅ **Developer Friendly**: Clean REST API with good documentation

### Getting Your API Key

1. Visit [football-data.org](https://www.football-data.org/client/register)
2. Create a free account
3. Get your API key from the dashboard
4. Add it to your environment variables

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd epl-app-next
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Required: Football Data API
FOOTBALL_DATA_API_KEY=your_football_data_api_key

# Required: Auth.js v5
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Required: Database (Prisma / PostgreSQL)
DATABASE_URL=your_postgres_connection_string

# Required: Magic-link email (SMTP)
EMAIL_SERVER=smtp://user:password@smtp.example.com:587
EMAIL_FROM="EPL App <noreply@example.com>"

# Optional: Cron job authorization
CRON_SECRET=your_cron_secret
```

> See [SETUP.md](SETUP.md) for the full database provisioning steps and [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) for auth configuration details.

### 4. Get Your Football Data API Key

- Go to [football-data.org/client/register](https://www.football-data.org/client/register)
- Sign up for a free account
- Copy your API key from the dashboard
- Add it to your `.env.local` file

### 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## npm Scripts

| Script            | Command                                                             | Description                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dev`             | `next dev --turbopack`                                              | Starts the development server on `localhost:3000` using Turbopack for fast incremental builds. Use this during local development.                                                                      |
| `build`           | `next build --turbopack`                                            | Compiles and optimizes the app for production using Turbopack. Must be run before `start`. Outputs to `.next/`.                                                                                        |
| `start`           | `next start`                                                        | Serves the production build locally. Requires `build` to have been run first.                                                                                                                          |
| `lint`            | `eslint`                                                            | Runs ESLint across the project to catch code quality and style issues.                                                                                                                                 |
| `points:calc`     | `node scripts/calculate-points.mjs`                                 | Manually triggers the points-calculation cron by POSTing to `/api/cron/calculate-points`. Supports `--matchday <n>`, `--all`, `--results <file>`, `--live`, `--url`, `--env`, `--secret`, `--dry-run`. |
| `results:fetch`   | `node --env-file=.env.test scripts/fetch-results.mjs`               | Fetches real Premier League results from Football-Data and writes them to `test-fixtures/`. Accepts `--md <range>` and `--season <year>`.                                                              |
| `test:expected`   | `node --env-file=.env.test scripts/compute-expected.mjs`            | Computes the independent expected-points oracle from the seeded predictions + results and prints a table.                                                                                              |
| `test:points`     | `node --env-file=.env.test scripts/verify-points.mjs`               | Asserts the app-calculated `user_points` match the expected-points oracle. Exits non-zero on mismatch (regression check).                                                                              |
| `db:test:migrate` | `node --env-file=.env.test node_modules/.bin/prisma migrate deploy` | Applies Prisma migrations to the **test** database defined in `.env.test`.                                                                                                                             |
| `db:test:studio`  | `node --env-file=.env.test node_modules/.bin/prisma studio`         | Opens Prisma Studio against the **test** database.                                                                                                                                                     |
| `db:test:seed`    | `node --env-file=.env.test prisma/seed-test.mjs`                    | Seeds the **test** database with users, a league, and MW1–5 predictions (real + synthetic).                                                                                                            |
| `dev:test`        | `node scripts/dev-test.mjs`                                         | Starts the dev server bound to the **test** database (loads `.env.test`).                                                                                                                              |
| `postinstall`     | `prisma generate`                                                   | Runs automatically after every `npm install`. Generates the Prisma Client from `prisma/schema.prisma`, making the typed database client available to the app.                                          |

> The `test:*`, `db:test:*`, `results:fetch`, and `dev:test` scripts support points-calculation testing against a separate test database. See [docs/POINTS_TESTING.md](docs/POINTS_TESTING.md) for the full workflow.

## API Features

### Available Data

- **Fixtures**: All Premier League matches with dates and times
- **Results**: Live scores and final results
- **Standings**: Current league table
- **Teams**: Team information, logos, and statistics
- **Matchdays**: All 38 gameweeks of the season

### Rate Limits

- **Free Tier**: 10 requests per minute
- **Sufficient for**: Most personal projects and small applications
- **Upgrade Available**: Paid plans for higher limits

### Endpoints Used

- `GET /competitions/2021/matches` - Premier League fixtures
- `GET /competitions/2021/matches?matchday=X` - Specific matchday
- `GET /competitions/2021/standings` - League table
- `GET /competitions/2021` - Competition info

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── Header.js               # Navigation and user info
│   │   ├── MatchCard.js            # Individual match display
│   │   ├── MatchList.js            # List of matches grouped by date
│   │   ├── WeekSelector.js         # Matchday navigation
│   │   ├── AuthButton.js           # Authentication component
│   │   ├── AuthProvider.js         # Authentication context provider
│   │   ├── ProtectedRoute.js       # Route protection component
│   │   ├── HowToPlayModal.js       # Instructions modal
│   │   ├── CacheDebug.js           # Development cache debugging
│   │   ├── LoadingSpinner.js       # Reusable loading indicator
│   │   ├── ErrorDisplay.js         # Standardized error display
│   │   ├── PredictionStats.js      # User prediction statistics
│   │   ├── SyncStatusIndicator.js  # Prediction sync status display
│   │   ├── MatchdayHeader.js       # Matchday header with status badges
│   │   └── EmptyState.js           # Empty state component
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/      # Auth.js v5 configuration
│   │   ├── cache/                  # Cache management API
│   │   ├── cache-warmup/           # Cache warming API
│   │   ├── cron/                   # Cron job endpoints (points calculation)
│   │   ├── leagues/                # League management API
│   │   ├── matchday/               # Current matchday API
│   │   ├── matches/                # Matches data API
│   │   ├── points/                 # User points API
│   │   └── predictions/            # Predictions management API
│   ├── auth/
│   │   ├── callback/               # Auth callback page
│   │   └── signin/                 # Sign-in page
│   └── page.js                     # Main application page (refactored)
├── hooks/
│   ├── useNetworkStatus.js         # Online/offline detection hook
│   ├── useMatches.js               # Match data loading and management
│   ├── usePredictions.js           # Prediction state and sync management
│   └── useCorrectPredictions.js    # Prediction scoring and statistics
├── lib/
│   ├── api.js                      # Football Data API integration
│   ├── api-cache.js                # API caching utilities
│   ├── auth-helpers.js             # Server-side auth helpers (requireUser, requireAdmin)
│   ├── cache.js                    # General caching utilities
│   ├── predictions.js              # Prediction service with offline support
│   ├── prisma.js                   # Prisma client singleton (with driver adapter)
│   ├── rate-limit.js               # Magic-link rate limiting (uses rate_limits table)
│   ├── utils.js                    # Helper functions and team mappings
│   └── warmup.js                   # Cache warming utilities
├── docs/                           # Documentation files
└── scores/                         # Sample score data
```

## Key Features Explained

### Recent Improvements ✨

**Database & Auth Migration (July 2026)**

- **Prisma ORM**: Replaced Supabase client with Prisma v7 + `@prisma/adapter-pg` for type-safe, schema-driven database access
- **Auth.js v5**: Replaced Google OAuth / Supabase Auth with passwordless magic-link email and WebAuthn passkeys
- **Prisma Schema**: 10 tables defined in `prisma/schema.prisma` covering auth, predictions, points, leagues, cron audit logs, and rate limiting — see [SETUP.md](SETUP.md#database-tables-reference) for the full table reference
- **Server-side Points**: Points calculated and stored in `user_points` table via cron job; no longer computed client-side from localStorage
- **Private Leagues**: Users can create and join private prediction leagues with unique join codes and per-league leaderboards (standings tab temporarily hidden while only the Premier League is supported)
- **Rate Limiting**: Magic-link sends capped at 5 per email per 15 minutes via the `rate_limits` table

**Code Refactoring (August 2025)**

- **Modular Architecture**: Extracted complex logic into reusable custom hooks
- **Component Separation**: Split large components into focused, single-responsibility components
- **Improved Maintainability**: Reduced main page from 719 lines to 120 lines
- **Better Developer Experience**: Cleaner code structure following React best practices
- **Enhanced Testability**: Isolated hooks and components for easier unit testing

### Real-Time Match Data

- Fetches live Premier League fixtures from Football Data API
- Displays match status: scheduled, live, finished
- Shows real scores and match information
- Updates automatically as matches progress

### Prediction System

- Users can predict exact match scores (not just outcomes)
- **Scoring System**:
  - 1 point for correct result (win/draw/loss)
  - 3 points total for exact score prediction (includes the 1 point for correct result)
- Predictions are persisted to PostgreSQL via Prisma (`user_predictions` table) with local backup
- Points are calculated server-side and stored in the `user_points` table after matches finish
- **Offline Support**: Predictions saved locally and synced when connection restored
- **Smart Retry**: Failed syncs automatically retry in background
- Predictions lock when matches start
- Visual feedback for saved predictions and sync status
- Real-time sync status indicators

### Matchday Navigation

- Browse all 38 Premier League matchdays
- See current, completed, and upcoming gameweeks
- Smart navigation with context-aware buttons
- Current matchday automatically highlighted

### Authentication

- Passwordless sign-in via **magic-link email** and **passkeys (WebAuthn)** using Auth.js v5
- No passwords — new accounts are created automatically on first sign-in
- Database session strategy (required for passkey support)
- Global admin role (`isAdmin`) and per-league admin roles
- Magic-link rate limiting: 5 sends per email address per 15 minutes

### Custom Hooks Architecture

**`useNetworkStatus`**

- Detects online/offline status
- Triggers reconnection handling
- Provides connection state to components

**`useMatches`**

- Manages match data loading and caching
- Handles matchday navigation
- Provides loading and error states

**`usePredictions`**

- Manages prediction state and persistence
- Handles offline/online sync with retry logic
- Provides prediction CRUD operations
- Background sync with queue management

**`useCorrectPredictions`**

- Calculates and tracks prediction accuracy
- Implements points scoring system
- Manages historical prediction statistics
- Prevents double-counting of finished matches

## Technologies Used

- **Next.js 15**: React framework with App Router and Turbopack
- **React 18**: Component library with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **Auth.js v5** (`next-auth@beta`): Passwordless authentication — magic-link email + WebAuthn passkeys
- **Prisma ORM v7**: Type-safe database client with `@prisma/adapter-pg` driver adapter
- **PostgreSQL**: Relational database (provisioned via Vercel Prisma integration or self-hosted)
- **Football Data API**: Premier League data source
- **Custom Hooks**: Modular state management and business logic

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support or questions:

- Check the [Football Data API documentation](https://www.football-data.org/documentation/quickstart)
- Review the issue tracker
- Contact the development team

---

**Note**: This app requires a free Football Data API key to function. The free tier provides access to Premier League data with reasonable rate limits for personal use.
