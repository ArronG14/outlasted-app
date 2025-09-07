import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useGameweekFixtures } from '../../hooks/useFPLData';

interface ViewFixturesProps {
  gameweek: number;
}

export function ViewFixtures({ gameweek }: ViewFixturesProps) {
  const { fixtures, loading, error } = useGameweekFixtures(gameweek);

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
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="text-[#3D5A80]" size={24} />
        <h3 className="text-xl font-semibold text-[#F8F8F6]">
          Gameweek {gameweek} Fixtures
        </h3>
      </div>

      <div className="grid gap-6">
        {fixtures.map((fixture) => (
          <div
            key={fixture.fixture_id}
            className="bg-[#171717] p-6 rounded-xl border border-[#404040] hover:border-[#00E5A0]/30 transition-all"
          >
            <div className="flex items-center justify-between">
              {/* Teams */}
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

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#404040] flex items-center justify-center">
                    <span className="text-[#737373] font-bold">VS</span>
                  </div>
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

              {/* Match Time */}
              <div className="text-right">
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
        ))}
      </div>
    </div>
  );
}
