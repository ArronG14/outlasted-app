import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Minus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { LiveScoreService, LiveScore } from '../../services/liveScoreService';

interface LiveScoresProps {
  gameweek: number;
  roomId: string;
  onResultsUpdated?: () => void;
}

export function LiveScores({ gameweek, roomId, onResultsUpdated }: LiveScoresProps) {
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLiveScores();
    // Refresh every 30 seconds
    const interval = setInterval(loadLiveScores, 30000);
    return () => clearInterval(interval);
  }, [gameweek]);

  const loadLiveScores = async () => {
    try {
      setLoading(true);
      setError('');
      const scores = await LiveScoreService.getGameweekLiveScores(gameweek);
      setLiveScores(scores);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live scores');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="text-green-400" size={18} />;
      case 'live':
        return <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />;
      default:
        return <Clock className="text-yellow-400" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Finished';
      case 'live':
        return 'Live';
      default:
        return 'Scheduled';
    }
  };

  const formatKickoffTime = (kickoffUtc: string) => {
    const date = new Date(kickoffUtc);
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London'
    });
  };

  const formatScore = (homeScore: number | null, awayScore: number | null) => {
    if (homeScore === null || awayScore === null) {
      return 'TBD';
    }
    return `${homeScore} - ${awayScore}`;
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Scores - Gameweek {gameweek}</h3>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-white/60 text-sm">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={loadLiveScores}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={14} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {liveScores.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">No fixtures available for this gameweek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liveScores.map((score) => (
            <div
              key={score.fixture_id}
              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(score.status)}
                      <span className="text-white/80 text-sm font-semibold">
                        {getStatusText(score.status)}
                      </span>
                    </div>
                    <span className="text-white/60 text-sm font-medium">
                      {formatKickoffTime(score.kickoff_utc)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-right flex-1">
                          <span className="text-white font-semibold text-lg">{score.home_team}</span>
                        </div>
                        
                        <div className="mx-6 flex flex-col items-center">
                          <div className="bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                            <span className="text-white font-bold text-xl">
                              {formatScore(score.home_score, score.away_score)}
                            </span>
                          </div>
                          <span className="text-white/60 text-xs mt-1">vs</span>
                        </div>
                        
                        <div className="text-left flex-1">
                          <span className="text-white font-semibold text-lg">{score.away_team}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gameweek Status */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-semibold">Gameweek Status:</span>
          <div className="flex items-center gap-3">
            {liveScores.every(score => score.status === 'finished') ? (
              <>
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-green-400 font-bold text-lg">All Games Finished</span>
              </>
            ) : liveScores.some(score => score.status === 'live') ? (
              <>
                <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                <span className="text-red-400 font-bold text-lg">Games In Progress</span>
              </>
            ) : (
              <>
                <Clock className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-bold text-lg">Games Scheduled</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
