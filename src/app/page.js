'use client';

import { useState } from 'react';
import Header from './components/Header';
import MatchList from './components/MatchList';
import WeekSelector from './components/WeekSelector';

// Comprehensive Premier League match data by weeks/rounds
const matchesByWeek = {
  1: [
    {
      id: 1,
      date: 'August 17',
      time: 'FT',
      league: 'Premier League',
      round: 1,
      homeTeam: { name: 'Manchester United', logo: '/team-logos/man-united.png' },
      awayTeam: { name: 'Fulham', logo: '/team-logos/fulham.png' },
      homeScore: 1,
      awayScore: 0,
      status: 'finished'
    },
    {
      id: 2,
      date: 'August 17',
      time: 'FT',
      league: 'Premier League',
      round: 1,
      homeTeam: { name: 'Arsenal', logo: '/team-logos/arsenal.png' },
      awayTeam: { name: 'Wolves', logo: '/team-logos/wolves.png' },
      homeScore: 2,
      awayScore: 0,
      status: 'finished'
    },
    {
      id: 3,
      date: 'August 17',
      time: 'FT',
      league: 'Premier League',
      round: 1,
      homeTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      awayTeam: { name: 'Everton', logo: '/team-logos/everton.png' },
      homeScore: 3,
      awayScore: 0,
      status: 'finished'
    },
    {
      id: 4,
      date: 'August 18',
      time: 'FT',
      league: 'Premier League',
      round: 1,
      homeTeam: { name: 'Newcastle', logo: '/team-logos/newcastle.png' },
      awayTeam: { name: 'Southampton', logo: '/team-logos/southampton.png' },
      homeScore: 1,
      awayScore: 0,
      status: 'finished'
    },
    {
      id: 5,
      date: 'August 18',
      time: 'FT',
      league: 'Premier League',
      round: 1,
      homeTeam: { name: 'Nottingham Forest', logo: '/team-logos/forest.png' },
      awayTeam: { name: 'Bournemouth', logo: '/team-logos/bournemouth.png' },
      homeScore: 1,
      awayScore: 1,
      status: 'finished'
    }
  ],
  2: [
    {
      id: 6,
      date: 'August 24',
      time: 'FT',
      league: 'Premier League',
      round: 2,
      homeTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      awayTeam: { name: 'Manchester United', logo: '/team-logos/man-united.png' },
      homeScore: 2,
      awayScore: 1,
      status: 'finished'
    },
    {
      id: 7,
      date: 'August 24',
      time: 'FT',
      league: 'Premier League',
      round: 2,
      homeTeam: { name: 'Crystal Palace', logo: '/team-logos/crystal-palace.png' },
      awayTeam: { name: 'Nottingham Forest', logo: '/team-logos/forest.png' },
      homeScore: 1,
      awayScore: 1,
      status: 'finished'
    },
    {
      id: 8,
      date: 'August 24',
      time: 'FT',
      league: 'Premier League',
      round: 2,
      homeTeam: { name: 'Everton', logo: '/team-logos/everton.png' },
      awayTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      homeScore: 2,
      awayScore: 0,
      status: 'finished'
    },
    {
      id: 9,
      date: 'August 25',
      time: 'FT',
      league: 'Premier League',
      round: 2,
      homeTeam: { name: 'Fulham', logo: '/team-logos/fulham.png' },
      awayTeam: { name: 'Manchester United', logo: '/team-logos/man-united.png' },
      homeScore: 1,
      awayScore: 1,
      status: 'finished'
    }
  ],
  3: [
    {
      id: 10,
      date: 'August 30',
      time: '06:30',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Chelsea', logo: '/team-logos/chelsea.png' },
      awayTeam: { name: 'Fulham', logo: '/team-logos/fulham.png' },
      homeProbability: 65,
      awayProbability: 20,
      status: 'upcoming'
    },
    {
      id: 11,
      date: 'August 30',
      time: '09:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Manchester United', logo: '/team-logos/man-united.png' },
      awayTeam: { name: 'Burnley', logo: '/team-logos/burnley.png' },
      homeProbability: 70,
      awayProbability: 15,
      status: 'upcoming'
    },
    {
      id: 12,
      date: 'August 30',
      time: '09:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Sunderland', logo: '/team-logos/sunderland.png' },
      awayTeam: { name: 'Brentford', logo: '/team-logos/brentford.png' },
      homeProbability: 45,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 13,
      date: 'August 30',
      time: '09:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Tottenham', logo: '/team-logos/tottenham.png' },
      awayTeam: { name: 'Bournemouth', logo: '/team-logos/bournemouth.png' },
      homeProbability: 60,
      awayProbability: 25,
      status: 'upcoming'
    },
    {
      id: 14,
      date: 'August 30',
      time: '09:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Wolves', logo: '/team-logos/wolves.png' },
      awayTeam: { name: 'Everton', logo: '/team-logos/everton.png' },
      homeProbability: 40,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 15,
      date: 'August 30',
      time: '11:30',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Leeds', logo: '/team-logos/leeds.png' },
      awayTeam: { name: 'Newcastle', logo: '/team-logos/newcastle.png' },
      homeProbability: 35,
      awayProbability: 45,
      status: 'upcoming'
    },
    {
      id: 16,
      date: 'August 31',
      time: '06:30',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      awayTeam: { name: 'Manchester City', logo: '/team-logos/man-city.png' },
      homeProbability: 20,
      awayProbability: 65,
      status: 'upcoming'
    },
    {
      id: 17,
      date: 'August 31',
      time: '08:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Nottingham Forest', logo: '/team-logos/forest.png' },
      awayTeam: { name: 'West Ham', logo: '/team-logos/west-ham.png' },
      homeProbability: 40,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 18,
      date: 'August 31',
      time: '10:30',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Liverpool', logo: '/team-logos/liverpool.png' },
      awayTeam: { name: 'Arsenal', logo: '/team-logos/arsenal.png' },
      homeProbability: 45,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 19,
      date: 'August 31',
      time: '13:00',
      league: 'Premier League',
      round: 3,
      homeTeam: { name: 'Aston Villa', logo: '/team-logos/aston-villa.png' },
      awayTeam: { name: 'Crystal Palace', logo: '/team-logos/crystal-palace.png' },
      homeProbability: 55,
      awayProbability: 25,
      status: 'upcoming'
    }
  ],
  4: [
    {
      id: 20,
      date: 'September 14',
      time: '12:30',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Arsenal', logo: '/team-logos/arsenal.png' },
      awayTeam: { name: 'Tottenham', logo: '/team-logos/tottenham.png' },
      homeProbability: 45,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 21,
      date: 'September 14',
      time: '15:00',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Manchester United', logo: '/team-logos/man-united.png' },
      awayTeam: { name: 'Liverpool', logo: '/team-logos/liverpool.png' },
      homeProbability: 30,
      awayProbability: 50,
      status: 'upcoming'
    },
    {
      id: 22,
      date: 'September 14',
      time: '15:00',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Brentford', logo: '/team-logos/brentford.png' },
      awayTeam: { name: 'West Ham', logo: '/team-logos/west-ham.png' },
      homeProbability: 40,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 23,
      date: 'September 14',
      time: '15:00',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Crystal Palace', logo: '/team-logos/crystal-palace.png' },
      awayTeam: { name: 'Leicester', logo: '/team-logos/leicester.png' },
      homeProbability: 50,
      awayProbability: 30,
      status: 'upcoming'
    },
    {
      id: 24,
      date: 'September 15',
      time: '14:00',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Newcastle', logo: '/team-logos/newcastle.png' },
      awayTeam: { name: 'Manchester City', logo: '/team-logos/man-city.png' },
      homeProbability: 25,
      awayProbability: 60,
      status: 'upcoming'
    },
    {
      id: 25,
      date: 'September 15',
      time: '16:30',
      league: 'Premier League',
      round: 4,
      homeTeam: { name: 'Chelsea', logo: '/team-logos/chelsea.png' },
      awayTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      homeProbability: 55,
      awayProbability: 25,
      status: 'upcoming'
    }
  ],
  5: [
    {
      id: 26,
      date: 'September 21',
      time: '12:30',
      league: 'Premier League',
      round: 5,
      homeTeam: { name: 'Liverpool', logo: '/team-logos/liverpool.png' },
      awayTeam: { name: 'Chelsea', logo: '/team-logos/chelsea.png' },
      homeProbability: 45,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 27,
      date: 'September 21',
      time: '15:00',
      league: 'Premier League',
      round: 5,
      homeTeam: { name: 'Brighton', logo: '/team-logos/brighton.png' },
      awayTeam: { name: 'Tottenham', logo: '/team-logos/tottenham.png' },
      homeProbability: 30,
      awayProbability: 45,
      status: 'upcoming'
    },
    {
      id: 28,
      date: 'September 21',
      time: '15:00',
      league: 'Premier League',
      round: 5,
      homeTeam: { name: 'Everton', logo: '/team-logos/everton.png' },
      awayTeam: { name: 'Crystal Palace', logo: '/team-logos/crystal-palace.png' },
      homeProbability: 45,
      awayProbability: 35,
      status: 'upcoming'
    },
    {
      id: 29,
      date: 'September 22',
      time: '16:00',
      league: 'Premier League',
      round: 5,
      homeTeam: { name: 'Manchester City', logo: '/team-logos/man-city.png' },
      awayTeam: { name: 'Arsenal', logo: '/team-logos/arsenal.png' },
      homeProbability: 50,
      awayProbability: 30,
      status: 'upcoming'
    },
    {
      id: 30,
      date: 'September 22',
      time: '18:30',
      league: 'Premier League',
      round: 5,
      homeTeam: { name: 'Aston Villa', logo: '/team-logos/aston-villa.png' },
      awayTeam: { name: 'Wolves', logo: '/team-logos/wolves.png' },
      homeProbability: 60,
      awayProbability: 25,
      status: 'upcoming'
    }
  ]
};

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(3);
  const [selectedLeague, setSelectedLeague] = useState('premier-league');
  const [predictions, setPredictions] = useState({});

  const handlePrediction = (matchId, prediction) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }));
  };

  // Get matches for current week
  const currentMatches = matchesByWeek[currentWeek] || [];
  
  // Filter matches by selected league
  const filteredMatches = selectedLeague === 'all' 
    ? currentMatches 
    : currentMatches.filter(match => {
        const leagueMap = {
          'premier-league': 'Premier League',
          'laliga': 'LaLiga',
          'bundesliga': 'Bundesliga'
        };
        return match.league === leagueMap[selectedLeague];
      });

  // Count predictions made for current week
  const currentWeekPredictions = currentMatches.filter(match => 
    match.status === 'upcoming' && predictions[match.id]
  ).length;

  // Get week status
  const getWeekStatus = (week) => {
    if (week < 3) return 'completed';
    if (week === 3) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header predictions={currentWeekPredictions} />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <WeekSelector 
          currentWeek={currentWeek} 
          onWeekChange={setCurrentWeek}
          getWeekStatus={getWeekStatus}
        />
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Week {currentWeek} - Round {currentWeek}
              {getWeekStatus(currentWeek) === 'completed' && (
                <span className="ml-2 text-sm bg-gray-600 px-2 py-1 rounded">Completed</span>
              )}
              {getWeekStatus(currentWeek) === 'upcoming' && (
                <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded">Upcoming</span>
              )}
              {getWeekStatus(currentWeek) === 'current' && (
                <span className="ml-2 text-sm bg-green-600 px-2 py-1 rounded">Current</span>
              )}
            </h2>
            <div className="text-sm text-gray-400">
              {getWeekStatus(currentWeek) === 'current' && 'Available now'}
              {getWeekStatus(currentWeek) === 'upcoming' && 'Opens soon'}
              {getWeekStatus(currentWeek) === 'completed' && 'Results available'}
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
          </div>
        </div>

        <MatchList 
          matches={filteredMatches} 
          selectedLeague={selectedLeague}
          predictions={predictions}
          onPrediction={handlePrediction}
        />
        
        {currentMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No matches available</div>
            <div className="text-gray-500 text-sm">Check back later or select a different week</div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <div className="bg-[#2d2d2d] rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-2">How to play</h3>
            <p className="text-gray-400 text-sm">
              Every week features a selection of matches from the top leagues. Make your predictions before matches start!
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
