# FotMob Predict Clone

A football prediction app built with Next.js that replicates the functionality and design of FotMob's prediction platform. Users can make predictions on football matches from various leagues and compete with friends.

## Features

- **Match Predictions**: Make predictions on upcoming football matches
- **League Filtering**: Filter matches by Premier League, LaLiga, Bundesliga, or view all
- **Weekly Rounds**: Navigate through different prediction weeks
- **Win Probabilities**: View AI-powered win probabilities for each team
- **Dark Theme**: Modern dark interface matching FotMob's design
- **Responsive Design**: Works on all device sizes

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── Header.js          # Top navigation bar
│   │   ├── WeekSelector.js    # Week navigation component
│   │   ├── MatchList.js       # Groups and displays matches
│   │   └── MatchCard.js       # Individual match prediction card
│   ├── globals.css            # Global styles and theme
│   ├── layout.js              # Root layout component
│   └── page.js                # Main page component
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 18** - UI library with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript** - Modern ES6+ features

## Features Details

### Match Predictions
- Click on team win buttons or draw to make predictions
- Visual feedback with green highlighting for selected predictions
- Win probability bars for each team

### League Filtering
- Toggle between all leagues or specific competitions
- Supports Premier League, LaLiga, and Bundesliga filtering

### Match States
- **Upcoming**: Shows prediction interface with probabilities
- **Finished**: Displays final scores with team names

## Customization

The app uses CSS custom properties for easy theming:
- `--background`: Main background color
- `--card-background`: Match card background
- `--accent-green`: Primary accent color
- `--text-muted`: Secondary text color

## Future Enhancements

- User authentication and profiles
- Leaderboards and scoring system
- Real match data integration
- Push notifications for match results
- Social sharing features

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
