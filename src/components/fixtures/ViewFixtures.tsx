import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Radio } from 'lucide-react';
import { useGameweekFixtures } from '../../hooks/useFPLData';

interface ViewFixturesProps {
  gameweek: number;
}

interface LiveFixture {
  id: number;
  event: number;
  finished: boolean;
  kickoff_time: string;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean;
  minutes: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export function ViewFixtures({ gameweek }: ViewFixturesProps) {
  const { fixtures, loading, error } = useGameweekFixtures(gameweek);
  const [liveFixtures, setLiveFixtures] = useState<LiveFixture[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);

  // Fetch live scores from FPL API
  useEffect(() => {
    const fetchLiveScores = async () => {
      if (!gameweek) return;
      
      setLiveLoading(true);
      try {
        const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
        const data = await response.json();
        
        // Filter fixtures for this gameweek
        const gameweekFixtures = data.filter((fixture: LiveFixture) => fixture.event === gameweek);
        setLiveFixtures(gameweekFixtures);
      } catch (err) {
        console.error('Error fetching live scores:', err);
      } finally {
        setLiveLoading(false);
      }
    };

    fetchLiveScores();
    
    // Refresh live scores every 30 seconds
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, [gameweek]);

  // Helper function to get live fixture data
  const getLiveFixture = (fixtureId: number) => {
    return liveFixtures.find(f => f.id === fixtureId);
  };

  // Helper function to get match status
  const getMatchStatus = (fixture: any, liveFixture?: LiveFixture) => {
    if (!liveFixture) return { status: 'upcoming', text: 'Upcoming', color: 'text-[#737373]' };
    
    if (liveFixture.finished) {
      return { status: 'finished', text: 'FT', color: 'text-[#00E5A0]' };
    } else if (liveFixture.started) {
      return { status: 'live', text: `${liveFixture.minutes}'`, color: 'text-[#EE6C4D]' };
    } else {
      return { status: 'upcoming', text: 'Upcoming', color: 'text-[#737373]' };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#262626] p-8 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-xl font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-[#404040] rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || fixtures.length === 0) {
    return (
      <div className="bg-[#262626] p-8 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-xl font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        <p className="text-[#737373]">
          {error ? 'Unable to load fixtures' : 'No fixtures available'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#262626] p-8 rounded-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-xl font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        
        {/* Live indicator */}
        {liveFixtures.some(f => f.started && !f.finished) && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#EE6C4D]/20 rounded-full">
            <Radio className="text-[#EE6C4D] animate-pulse" size={16} />
            <span className="text-[#EE6C4D] font-medium text-sm">LIVE MATCHES</span>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {fixtures.map((fixture) => {
          const liveFixture = getLiveFixture(fixture.fixture_id);
          const matchStatus = getMatchStatus(fixture, liveFixture);
          const isLive = matchStatus.status === 'live';
          const isFinished = matchStatus.status === 'finished';
          
          return (
            <div
              key={fixture.fixture_id}
              className={`bg-[#171717] p-6 rounded-xl border transition-all ${
                isLive 
                  ? 'border-[#EE6C4D] shadow-lg shadow-[#EE6C4D]/20' 
                  : isFinished
                  ? 'border-[#00E5A0]/30'
                  : 'border-[#404040] hover:border-[#00E5A0]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Teams and Score */}
                <div className="flex items-center gap-8">
                  {/* Home Team */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#F8F8F6] mb-1">
                      {fixture.home_team?.short_name || 'TBD'}
                    </div>
                    <div className="text-sm text-[#737373]">
                      {fixture.home_team?.name || 'To Be Determined'}
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex items-center gap-4">
                    {isFinished || isLive ? (
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-[#F8F8F6]">
                          {liveFixture?.team_h_score ?? '-'}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[#404040] flex items-center justify-center">
                          <span className="text-[#737373] font-bold">VS</span>
                        </div>
                        <div className="text-3xl font-bold text-[#F8F8F6]">
                          {liveFixture?.team_a_score ?? '-'}
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#404040] flex items-center justify-center">
                        <span className="text-[#737373] font-bold">VS</span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#F8F8F6] mb-1">
                      {fixture.away_team?.short_name || 'TBD'}
                    </div>
                    <div className="text-sm text-[#737373]">
                      {fixture.away_team?.name || 'To Be Determined'}
                    </div>
                  </div>
                </div>

                {/* Match Status and Time */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {isLive && (
                      <div className="flex items-center gap-1">
                        <Radio className="text-[#EE6C4D] animate-pulse" size={16} />
                        <span className="text-[#EE6C4D] font-bold text-sm">LIVE</span>
                      </div>
                    )}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      matchStatus.status === 'live' ? 'bg-[#EE6C4D]/20 text-[#EE6C4D]' :
                      matchStatus.status === 'finished' ? 'bg-[#00E5A0]/20 text-[#00E5A0]' :
                      'bg-[#737373]/20 text-[#737373]'
                    }`}>
                      {matchStatus.text}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#00E5A0] mb-1">
                    <Clock size={16} />
                    <span className="font-medium">
                      {new Date(fixture.kickoff_utc).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-[#737373]">
                    {new Date(fixture.kickoff_utc).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/London'
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
