import React from 'react';
import { Calendar, Clock, AlertCircle, Lock } from 'lucide-react';
import { useGameweekFixtures } from '../../hooks/useFPLData';

interface GameweekFixturesProps {
  gameweek: number;
  onTeamSelect?: (teamName: string) => void;
  selectedTeam?: string;
  usedTeams?: string[];
}

export function GameweekFixtures({ 
  gameweek, 
  onTeamSelect, 
  selectedTeam, 
  usedTeams = [] 
}: GameweekFixturesProps) {
  const { fixtures, picksLocked, loading, error } = useGameweekFixtures(gameweek);

  if (loading) {
    return (
      <div className="bg-[#262626] p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-[#404040] rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || fixtures.length === 0) {
    return (
      <div className="bg-[#262626] p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-[#EE6C4D]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        <p className="text-[#737373]">
          {error ? 'Unable to load fixtures' : 'No fixtures available'}
        </p>
      </div>
    );
  }

  const isTeamUsed = (teamName: string) => usedTeams.includes(teamName);
  const isTeamSelected = (teamName: string) => selectedTeam === teamName;

  return (
    <div className="bg-[#262626] p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">
            Gameweek {gameweek} Fixtures
          </h3>
        </div>
        {picksLocked && (
          <div className="flex items-center gap-2 text-[#EE6C4D]">
            <Lock size={16} />
            <span className="text-sm font-medium">Picks Locked</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {fixtures.map((fixture) => (
          <div
            key={fixture.fixture_id}
            className="bg-[#171717] p-4 rounded-lg border border-[#404040]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                {/* Home Team */}
                <button
                  onClick={() => onTeamSelect?.(fixture.home_team?.name || '')}
                  disabled={picksLocked || isTeamUsed(fixture.home_team?.name || '')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    isTeamSelected(fixture.home_team?.name || '')
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : isTeamUsed(fixture.home_team?.name || '')
                      ? 'bg-[#404040] border-[#404040] text-[#737373] cursor-not-allowed'
                      : picksLocked
                      ? 'bg-[#404040] border-[#404040] text-[#737373] cursor-not-allowed'
                      : 'bg-[#262626] border-[#737373] text-[#F8F8F6] hover:border-[#00E5A0] hover:text-[#00E5A0] cursor-pointer'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">
                      {fixture.home_team?.short_name || 'TBD'}
                    </div>
                    <div className="text-xs opacity-75">
                      {fixture.home_team?.name || 'To Be Determined'}
                    </div>
                  </div>
                </button>

                <span className="text-[#737373] font-medium">vs</span>

                {/* Away Team */}
                <button
                  onClick={() => onTeamSelect?.(fixture.away_team?.name || '')}
                  disabled={picksLocked || isTeamUsed(fixture.away_team?.name || '')}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    isTeamSelected(fixture.away_team?.name || '')
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : isTeamUsed(fixture.away_team?.name || '')
                      ? 'bg-[#404040] border-[#404040] text-[#737373] cursor-not-allowed'
                      : picksLocked
                      ? 'bg-[#404040] border-[#404040] text-[#737373] cursor-not-allowed'
                      : 'bg-[#262626] border-[#737373] text-[#F8F8F6] hover:border-[#00E5A0] hover:text-[#00E5A0] cursor-pointer'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">
                      {fixture.away_team?.short_name || 'TBD'}
                    </div>
                    <div className="text-xs opacity-75">
                      {fixture.away_team?.name || 'To Be Determined'}
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[#737373]">
                <Clock size={16} />
                <span className="text-sm">
                  {new Date(fixture.kickoff_utc).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London'
                  })}
                </span>
              </div>
            </div>

            {/* Used team indicators */}
            <div className="flex gap-2 text-xs">
              {isTeamUsed(fixture.home_team?.name || '') && (
                <span className="text-[#737373]">
                  {fixture.home_team?.short_name} already used
                </span>
              )}
              {isTeamUsed(fixture.away_team?.name || '') && (
                <span className="text-[#737373]">
                  {fixture.away_team?.short_name} already used
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {picksLocked && (
        <div className="mt-4 p-3 bg-[#EE6C4D]/10 border border-[#EE6C4D]/30 rounded-lg">
          <p className="text-[#EE6C4D] text-sm">
            The deadline for this gameweek has passed. Picks are now locked.
          </p>
        </div>
      )}
    </div>
  );
}