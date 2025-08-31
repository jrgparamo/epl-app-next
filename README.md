# EPL Prediction App

A modern Next.js application for predicting English Premier League match results, built with real-time data from the Football Data API.

## Features

- 🏆 **Real Premier League Data**: Live fixtures, results, and standings from Football Data API
- 🎯 **Match Predictions**: Make score predictions on upcoming matches with points scoring system
- 🔐 **User Authentication**: Secure login with Google OAuth via Supabase
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
NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_football_data_api_key

# Required: NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Required: Supabase (for user data and predictions)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

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
│   │   │   └── [...nextauth]/      # NextAuth configuration
│   │   ├── cache/                  # Cache management API
│   │   ├── cache-warmup/           # Cache warming API
│   │   ├── matchday/               # Current matchday API
│   │   ├── matches/                # Matches data API
│   │   └── predictions/            # Predictions management API
│   ├── auth/
│   │   ├── callback/               # OAuth callback page
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
│   ├── cache.js                    # General caching utilities
│   ├── predictions.js              # Prediction service with offline support
│   ├── supabase.js                 # Supabase database client
│   ├── utils.js                    # Helper functions and team mappings
│   └── warmup.js                   # Cache warming utilities
├── docs/                           # Documentation files
└── scores/                         # Sample score data
```

## Key Features Explained

### Recent Improvements ✨

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
- Predictions are saved to Supabase database with local backup
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

- Google OAuth integration via Supabase
- Persistent user sessions
- User-specific prediction storage
- Secure authentication flow

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
- **NextAuth.js**: Authentication library with Google OAuth
- **Supabase**: Backend-as-a-Service for database and authentication
- **Football Data API**: Premier League data source
- **Custom Hooks**: Modular state management and business logic
- **Service Workers**: Offline support and background sync

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
