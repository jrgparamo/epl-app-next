'use client';

import { useState } from 'react';
import Header from './components/Header';
import MatchList from './components/MatchList';
import WeekSelector from './components/WeekSelector';

// Mock data based on FotMob structure
const mockMatches = [
  {
    id: 1,
    date: 'Today',
    time: '10:30 AM',
    league: 'Premier League',
    homeTeam: { name: 'Fulham', logo: '/team-logos/fulham.png' },
    awayTeam: { name: 'Man United', logo: '/team-logos/man-united.png' },
    homeProbability: 25,
    awayProbability: 55,
    status: 'upcoming'
  },
  {
    id: 2,
    date: 'Today',
    time: '02:30 PM',
    league: 'LaLiga',
    homeTeam: { name: 'Real Oviedo', logo: '/team-logos/real-oviedo.png' },
    awayTeam: { name: 'Real Madrid', logo: '/team-logos/real-madrid.png' },
    homeProbability: 11,
    awayProbability: 70,
    status: 'upcoming'
  },
  {
    id: 3,
    date: 'Yesterday',
    time: 'FT',
    league: 'Premier League',
    homeTeam: { name: 'Man City', logo: '/team-logos/man-city.png' },
    awayTeam: { name: 'Tottenham', logo: '/team-logos/tottenham.png' },
    homeScore: 0,
    awayScore: 2,
    status: 'finished'
  },
  {
    id: 4,
    date: 'Yesterday',
    time: 'FT',
    league: 'Premier League',
    homeTeam: { name: 'Arsenal', logo: '/team-logos/arsenal.png' },
    awayTeam: { name: 'Leeds', logo: '/team-logos/leeds.png' },
    homeScore: 5,
    awayScore: 0,
    status: 'finished'
  },
  {
    id: 5,
    date: 'Friday, August 22',
    time: 'FT',
    league: 'Bundesliga',
    homeTeam: { name: 'Bayern München', logo: '/team-logos/bayern.png' },
    awayTeam: { name: 'RB Leipzig', logo: '/team-logos/leipzig.png' },
    homeScore: 6,
    awayScore: 0,
    status: 'finished'
  }
];

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(3);
  const [selectedLeague, setSelectedLeague] = useState('all');

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <WeekSelector 
          currentWeek={currentWeek} 
          onWeekChange={setCurrentWeek}
        />
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Week {currentWeek}</h2>
            <div className="text-sm text-gray-400">
              Available in 5 Hours 15 Minutes
            </div>
          </div>
          
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setSelectedLeague('all')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedLeague === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Leagues
            </button>
            <button
              onClick={() => setSelectedLeague('premier-league')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedLeague === 'premier-league' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Premier League
            </button>
            <button
              onClick={() => setSelectedLeague('laliga')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedLeague === 'laliga' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              LaLiga
            </button>
            <button
              onClick={() => setSelectedLeague('bundesliga')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedLeague === 'bundesliga' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Bundesliga
            </button>
          </div>
        </div>

        <MatchList 
          matches={mockMatches} 
          selectedLeague={selectedLeague}
        />
        
        <div className="mt-8 text-center">
          <div className="bg-[#2d2d2d] rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-2">How to play</h3>
            <p className="text-gray-400 text-sm">
              Every week features a selection of matches from the top leagues.
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            FotMob is the essential football app. © Copyright 2025 FotMob
          </div>
        </div>
      </main>
    </div>
  );
}
