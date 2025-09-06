import React from 'react';
import { Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { useUpcomingFixtures } from '../../hooks/useFPLData';
import { useNavigate } from 'react-router-dom';

export function UpcomingFixtures() {
  const { fixtures, loading, error } = useUpcomingFixtures(4);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-[#262626] p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">Upcoming Fixtures</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-[#404040] rounded mb-2"></div>
              <div className="h-3 bg-[#404040] rounded w-2/3"></div>
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
          <h3 className="text-lg font-semibold text-[#F8F8F6]">Upcoming Fixtures</h3>
        </div>
        <p className="text-[#737373]">
          {error ? 'Unable to load fixtures' : 'No upcoming fixtures'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#262626] p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-[#3D5A80]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">Upcoming Fixtures</h3>
        </div>
        <button
          onClick={() => navigate('/fixtures')}
          className="text-[#00E5A0] hover:text-[#00E5A0]/80 transition-colors"
          title="View all fixtures"
        >
          <ExternalLink size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {fixtures.map((fixture) => (
          <div key={fixture.fixture_id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#F8F8F6] font-medium">
                {fixture.home_team?.short_name || 'TBD'}
              </span>
              <span className="text-[#737373]">vs</span>
              <span className="text-[#F8F8F6] font-medium">
                {fixture.away_team?.short_name || 'TBD'}
              </span>
            </div>
            <span className="text-[#737373] text-sm">
              {new Date(fixture.kickoff_utc).toLocaleDateString('en-GB', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/London'
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}