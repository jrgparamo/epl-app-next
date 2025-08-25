# EPL Prediction App

A modern Next.js application for predicting English Premier League match results, built with real-time data from the Football Data API.

## Features

- 🏆 **Real Premier League Data**: Live fixtures, results, and standings from Football Data API
- 🎯 **Match Predictions**: Make predictions on upcoming matches
- 🔐 **User Authentication**: Secure login with Google OAuth
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Real-time Updates**: Live match status and score updates
- 🎨 **Modern UI**: Dark theme with Tailwind CSS
- 📊 **Matchday Navigation**: Browse all 38 Premier League matchdays

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

# Optional: Google OAuth
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
│   │   ├── Header.js          # Navigation and user info
│   │   ├── MatchCard.js       # Individual match display
│   │   ├── MatchList.js       # List of matches grouped by date
│   │   ├── WeekSelector.js    # Matchday navigation
│   │   └── AuthButton.js      # Authentication component
│   ├── api/
│   │   └── auth/              # NextAuth configuration
│   └── page.js                # Main application page
├── lib/
│   ├── api.js                 # Football Data API integration
│   └── utils.js               # Helper functions and team mappings
└── hooks/
    └── useAuth.js             # Authentication hook
```

## Key Features Explained

### Real-Time Match Data

- Fetches live Premier League fixtures from Football Data API
- Displays match status: scheduled, live, finished
- Shows real scores and match information
- Updates automatically as matches progress

### Prediction System

- Users can predict match outcomes (Home, Draw, Away)
- Predictions are saved locally per user
- Predictions lock when matches start
- Visual feedback for saved predictions

### Matchday Navigation

- Browse all 38 Premier League matchdays
- See current, completed, and upcoming gameweeks
- Smart navigation with context-aware buttons
- Current matchday automatically highlighted

### Authentication

- Google OAuth integration
- Persistent user sessions
- User-specific prediction storage
- Secure authentication flow

## Technologies Used

- **Next.js 14**: React framework with App Router
- **React 18**: Component library
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication library
- **Football Data API**: Premier League data source

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
