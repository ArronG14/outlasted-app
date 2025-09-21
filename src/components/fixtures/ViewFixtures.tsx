import { useState, useEffect } from 'react';
import { Calendar, Clock, Radio } from 'lucide-react';
import { useGameweekFixtures } from '../../hooks/useFPLData';
import { LiveScoreService, LiveScore } from '../../services/liveScoreService';

interface ViewFixturesProps {
  gameweek: number;
}


export function ViewFixtures({ gameweek }: ViewFixturesProps) {
  const { fixtures, loading, error } = useGameweekFixtures(gameweek);
  const [liveFixtures, setLiveFixtures] = useState<LiveScore[]>([]);

  // Fetch live scores from FPL API
  useEffect(() => {
    const fetchLiveScores = async () => {
      if (!gameweek) return;
      
      try {
        const scores = await LiveScoreService.fetchLiveScores();
        
        // Filter fixtures for this gameweek
        const gameweekScores = scores.filter(score => score.gameweek === gameweek);
        setLiveFixtures(gameweekScores);
      } catch (err) {
        console.error('Error fetching live scores:', err);
      }
    };

    fetchLiveScores();
    
    // Refresh live scores every 30 seconds
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, [gameweek]);

  // Helper function to get live fixture data
  const getLiveFixture = (fixtureId: number) => {
    const found = liveFixtures.find(f => f.fixture_id === fixtureId);
    if (!found && liveFixtures.length > 0) {
      console.log(`🔍 LiveFixture not found for ID ${fixtureId}. Available IDs:`, liveFixtures.map(f => f.fixture_id));
    }
    return found;
  };

  // Helper function to get match status
  const getMatchStatus = (fixture: any, liveFixture?: LiveScore) => {
    const now = new Date();
    const kickoffTime = new Date(fixture.kickoff_utc);
    
    // If we have live data, use it
    if (liveFixture) {
      if (liveFixture.status === 'finished') {
        return { status: 'finished', text: 'FT', color: 'text-[#00E5A0]' };
      } else if (liveFixture.status === 'live') {
        return { status: 'live', text: 'Live', color: 'text-[#EE6C4D]' };
      }
    }
    
    // If no live data, check if game time has passed
    if (now > kickoffTime) {
      // Game should be finished (assume 2 hours max game time)
      const gameEndTime = new Date(kickoffTime.getTime() + 2 * 60 * 60 * 1000);
      if (now > gameEndTime) {
        return { status: 'finished', text: 'FT', color: 'text-[#00E5A0]' };
      } else {
        // Game might be in progress
        return { status: 'live', text: 'Live', color: 'text-[#EE6C4D]' };
      }
    }
    
    // Game hasn't started yet
    return { status: 'upcoming', text: 'Upcoming', color: 'text-[#737373]' };
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

  // Group fixtures by date
  const fixturesByDate = fixtures.reduce((acc, fixture) => {
    const kickoffDate = new Date(fixture.kickoff_utc);
    const dateKey = kickoffDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(fixture);
    return acc;
  }, {} as Record<string, typeof fixtures>);

  // Sort fixtures within each date by time
  Object.keys(fixturesByDate).forEach(date => {
    fixturesByDate[date].sort((a, b) => 
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    );
  });

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
        {liveFixtures.some(f => f.status === 'live') && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#EE6C4D]/20 rounded-full">
            <Radio className="text-[#EE6C4D] animate-pulse" size={16} />
            <span className="text-[#EE6C4D] font-medium text-sm">LIVE MATCHES</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(fixturesByDate).map(([date, dayFixtures]) => (
          <div key={date}>
            {/* Date Badge */}
            <div className="mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-[#3D5A80]/20 text-[#3D5A80] rounded-full font-semibold">
                <Calendar className="mr-2" size={16} />
                {date}
              </div>
            </div>

            {/* Fixtures for this date */}
            <div className="grid gap-4">
              {dayFixtures.map((fixture) => {
                const liveFixture = getLiveFixture(fixture.fixture_id);
                const matchStatus = getMatchStatus(fixture, liveFixture);
                const isLive = matchStatus.status === 'live';
                const isFinished = matchStatus.status === 'finished';
                
                return (
                  <div
                    key={fixture.fixture_id}
                    className={`bg-[#171717] p-4 rounded-xl border transition-all ${
                      isLive 
                        ? 'border-[#EE6C4D] shadow-lg shadow-[#EE6C4D]/20' 
                        : isFinished
                        ? 'border-[#00E5A0]/30'
                        : 'border-[#404040] hover:border-[#00E5A0]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Teams and Score */}
                      <div className="flex items-center gap-6">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className="text-xl font-bold text-[#F8F8F6] mb-1">
                            {fixture.home_team?.short_name || 'TBD'}
                          </div>
                          <div className="text-xs text-[#737373]">
                            {fixture.home_team?.name || 'To Be Determined'}
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="flex items-center gap-3">
                          {isFinished || isLive ? (
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-[#F8F8F6]">
                                {liveFixture?.home_score ?? '-'}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-[#404040] flex items-center justify-center">
                                <span className="text-[#737373] font-bold text-xs">VS</span>
                              </div>
                              <div className="text-2xl font-bold text-[#F8F8F6]">
                                {liveFixture?.away_score ?? '-'}
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#404040] flex items-center justify-center">
                              <span className="text-[#737373] font-bold text-xs">VS</span>
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                          <div className="text-xl font-bold text-[#F8F8F6] mb-1">
                            {fixture.away_team?.short_name || 'TBD'}
                          </div>
                          <div className="text-xs text-[#737373]">
                            {fixture.away_team?.name || 'To Be Determined'}
                          </div>
                        </div>
                      </div>

                      {/* Match Status and Time */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {isLive && (
                            <div className="flex items-center gap-1">
                              <Radio className="text-[#EE6C4D] animate-pulse" size={14} />
                              <span className="text-[#EE6C4D] font-bold text-xs">LIVE</span>
                            </div>
                          )}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            matchStatus.status === 'live' ? 'bg-[#EE6C4D]/20 text-[#EE6C4D]' :
                            matchStatus.status === 'finished' ? 'bg-[#00E5A0]/20 text-[#00E5A0]' :
                            'bg-[#737373]/20 text-[#737373]'
                          }`}>
                            {matchStatus.text}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[#00E5A0] text-sm">
                          <Clock size={14} />
                          <span>
                            {new Date(fixture.kickoff_utc).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/London'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
