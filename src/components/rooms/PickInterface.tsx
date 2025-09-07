import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Users, X } from 'lucide-react';
import { PickService } from '../../services/pickService';
import { FPLService } from '../../services/fplService';
import { Button } from '../ui/Button';
import { PREMIER_LEAGUE_TEAMS } from '../../types/database';
import { Fixture } from '../../types/fpl';
import { supabase } from '../../lib/supabase';

interface PickInterfaceProps {
  roomId: string;
  currentGameweek: number;
  onPickMade: () => void;
}

interface UserPick {
  id: string;
  gameweek: number;
  team_name: string;
  is_locked: boolean;
  result: string;
  created_at: string;
}

interface Gameweek {
  gw: number;
  deadline_utc: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

export function PickInterface({ roomId, currentGameweek, onPickMade }: PickInterfaceProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedGameweek, setSelectedGameweek] = useState<number>(currentGameweek);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [showAllGameweeks, setShowAllGameweeks] = useState(false);

  useEffect(() => {
    loadUserPicks();
    loadGameweeks();
  }, [roomId]);

  useEffect(() => {
    if (selectedGameweek) {
      loadFixtures(selectedGameweek);
    }
  }, [selectedGameweek]);

  const loadUserPicks = async () => {
    try {
      const picks = await PickService.getUserPicks(roomId);
      setUserPicks(picks);
    } catch (err) {
      console.error('Error loading picks:', err);
    }
  };

  const loadGameweeks = async () => {
    try {
      const gws = await FPLService.getGameweeks();
      // Show all gameweeks (we'll filter in the UI)
      setGameweeks(gws);
    } catch (err) {
      console.error('Error loading gameweeks:', err);
    }
  };

  const loadFixtures = async (gameweek: number) => {
    try {
      setLoadingFixtures(true);
      const fixturesData = await FPLService.listFixtures(gameweek);
      setFixtures(fixturesData);
    } catch (err) {
      console.error('Error loading fixtures:', err);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const handleMakePick = async () => {
    if (!selectedTeam || !selectedGameweek) return;

    try {
      setLoading(true);
      setError('');
      await PickService.makePick(roomId, selectedGameweek, selectedTeam);
      await loadUserPicks();
      setSelectedTeam('');
      onPickMade();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePick = async (gameweek: number) => {
    try {
      setLoading(true);
      setError('');
      // Remove the pick for this gameweek
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('picks')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', user.id)
        .eq('gameweek', gameweek);

      if (error) throw error;
      await loadUserPicks();
      onPickMade();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pick');
    } finally {
      setLoading(false);
    }
  };

  const getPickStatus = (gameweek: number) => {
    const pick = userPicks.find(p => p.gameweek === gameweek);
    if (!pick) return 'awaiting';
    if (pick.is_locked) return 'locked';
    return 'picked';
  };

  const isDeadlinePassed = (gameweek: number) => {
    const gw = gameweeks.find(g => g.gw === gameweek);
    if (!gw) return false;
    const deadline = new Date(gw.deadline_utc);
    const now = new Date();
    return now > deadline;
  };

  const getUsedTeams = () => {
    return userPicks.map(pick => pick.team_name);
  };

  const getTeamPickInfo = (teamName: string) => {
    const pick = userPicks.find(p => p.team_name === teamName);
    return pick ? { gameweek: pick.gameweek, isLocked: pick.is_locked } : null;
  };

  const canPickTeam = (teamName: string, currentGameweek: number) => {
    const pickInfo = getTeamPickInfo(teamName);
    if (!pickInfo) return true; // Team not picked yet
    
    // Can't pick if already picked for this gameweek
    if (pickInfo.gameweek === currentGameweek) return false;
    
    // Can pick if picked for future gameweek (will replace that pick)
    return pickInfo.gameweek > currentGameweek;
  };

  const isUserEliminated = () => {
    // Check if user has any losing picks
    return userPicks.some(pick => pick.result === 'lose');
  };

  const getPickResult = (gameweek: number) => {
    const pick = userPicks.find(p => p.gameweek === gameweek);
    return pick?.result || null;
  };

  const getAvailableGameweeks = () => {
    // Filter out gameweeks 1-3 and only show from current gameweek onwards
    return gameweeks.filter(gw => gw.gw >= currentGameweek);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Make Your Picks</h2>
      
      {isUserEliminated() && (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400 font-semibold">You have been eliminated from this room</p>
          </div>
          <p className="text-red-300 text-sm mt-1">You cannot make any more picks</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Historic Picks Bar */}
      {userPicks.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Your Picks</h3>
          <div className="flex flex-wrap gap-3">
            {userPicks
              .sort((a, b) => a.gameweek - b.gameweek)
              .map((pick) => (
                <div
                  key={pick.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    pick.is_locked 
                      ? 'bg-white/10 text-white/70 border border-white/20' 
                      : 'bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30'
                  }`}
                >
                  <span className="font-bold">GW{pick.gameweek}:</span>
                  <span>{pick.team_name}</span>
                  {!pick.is_locked && !isDeadlinePassed(pick.gameweek) && (
                    <button
                      onClick={() => handleRemovePick(pick.gameweek)}
                      disabled={loading}
                      className="ml-1 p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Gameweek Selection */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Select Gameweek</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {getAvailableGameweeks()
            .slice(0, showAllGameweeks ? undefined : 6) // Show 6 by default, all if expanded
            .map((gw) => {
            const status = getPickStatus(gw.gw);
            const deadlinePassed = isDeadlinePassed(gw.gw);
            const result = getPickResult(gw.gw);
            const isEliminated = isUserEliminated();
            
            return (
              <Button
                key={gw.gw}
                onClick={() => setSelectedGameweek(gw.gw)}
                disabled={deadlinePassed || isEliminated}
                className={`p-3 text-sm font-semibold transition-all ${
                  selectedGameweek === gw.gw
                    ? 'bg-[#00E5A0] text-black shadow-lg shadow-[#00E5A0]/25'
                    : deadlinePassed || isEliminated
                    ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                    : status === 'picked'
                    ? 'bg-[#00E5A0]/20 text-[#00E5A0] border-2 border-[#00E5A0] hover:bg-[#00E5A0]/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>GW{gw.gw}</span>
                  {status === 'picked' && <CheckCircle size={14} />}
                  {result === 'win' && <span className="text-green-400">✓</span>}
                  {result === 'lose' && <span className="text-red-400">✗</span>}
                </div>
              </Button>
            );
          })}
        </div>
        
        {getAvailableGameweeks().length > 6 && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setShowAllGameweeks(!showAllGameweeks)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {showAllGameweeks ? 'Show Less' : `Show More (${getAvailableGameweeks().length - 6} more)`}
            </Button>
          </div>
        )}
      </div>

      {/* Fixtures and Team Selection */}
      {selectedGameweek && !isDeadlinePassed(selectedGameweek) && !isUserEliminated() && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Select Team for Gameweek {selectedGameweek}
          </h3>
          
          {loadingFixtures ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E5A0] mx-auto"></div>
              <p className="text-white/70 mt-2">Loading fixtures...</p>
            </div>
          ) : fixtures.length > 0 ? (
            <div className="space-y-3">
              {fixtures.map((fixture) => {
                const homeTeam = fixture.home_team?.name || 'TBD';
                const awayTeam = fixture.away_team?.name || 'TBD';
                const kickoffTime = new Date(fixture.kickoff_utc).toLocaleString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/London'
                });
                
                const homePickInfo = getTeamPickInfo(homeTeam);
                const awayPickInfo = getTeamPickInfo(awayTeam);
                const homeCanPick = canPickTeam(homeTeam, selectedGameweek);
                const awayCanPick = canPickTeam(awayTeam, selectedGameweek);
                
                return (
                  <div key={fixture.fixture_id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/70 text-sm font-medium">{kickoffTime}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      {/* Home Team */}
                      <div className="flex-1">
                        <Button
                          onClick={() => setSelectedTeam(homeTeam)}
                          disabled={!homeCanPick || loading}
                          className={`w-full p-4 text-sm font-semibold transition-all ${
                            selectedTeam === homeTeam
                              ? 'bg-[#00E5A0] text-black shadow-lg shadow-[#00E5A0]/25'
                              : homePickInfo?.gameweek === selectedGameweek
                              ? 'bg-[#00E5A0]/20 text-[#00E5A0] border-2 border-[#00E5A0] cursor-default'
                              : homePickInfo && homePickInfo.gameweek > selectedGameweek
                              ? 'bg-[#C9B037]/20 text-[#C9B037] border-2 border-[#C9B037] hover:bg-[#C9B037]/30'
                              : homePickInfo && homePickInfo.gameweek < selectedGameweek
                              ? 'bg-red-500/20 text-red-400 border-2 border-red-500 cursor-not-allowed'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{homeTeam}</span>
                            {homePickInfo?.gameweek === selectedGameweek && (
                              <span className="text-xs mt-1">✓ Picked for GW{homePickInfo.gameweek}</span>
                            )}
                            {homePickInfo && homePickInfo.gameweek > selectedGameweek && (
                              <span className="text-xs mt-1">Picked for GW{homePickInfo.gameweek}</span>
                            )}
                            {homePickInfo && homePickInfo.gameweek < selectedGameweek && (
                              <span className="text-xs mt-1">Used in GW{homePickInfo.gameweek}</span>
                            )}
                          </div>
                        </Button>
                      </div>
                      
                      <div className="text-white/50 font-bold text-lg">VS</div>
                      
                      {/* Away Team */}
                      <div className="flex-1">
                        <Button
                          onClick={() => setSelectedTeam(awayTeam)}
                          disabled={!awayCanPick || loading}
                          className={`w-full p-4 text-sm font-semibold transition-all ${
                            selectedTeam === awayTeam
                              ? 'bg-[#00E5A0] text-black shadow-lg shadow-[#00E5A0]/25'
                              : awayPickInfo?.gameweek === selectedGameweek
                              ? 'bg-[#00E5A0]/20 text-[#00E5A0] border-2 border-[#00E5A0] cursor-default'
                              : awayPickInfo && awayPickInfo.gameweek > selectedGameweek
                              ? 'bg-[#C9B037]/20 text-[#C9B037] border-2 border-[#C9B037] hover:bg-[#C9B037]/30'
                              : awayPickInfo && awayPickInfo.gameweek < selectedGameweek
                              ? 'bg-red-500/20 text-red-400 border-2 border-red-500 cursor-not-allowed'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{awayTeam}</span>
                            {awayPickInfo?.gameweek === selectedGameweek && (
                              <span className="text-xs mt-1">✓ Picked for GW{awayPickInfo.gameweek}</span>
                            )}
                            {awayPickInfo && awayPickInfo.gameweek > selectedGameweek && (
                              <span className="text-xs mt-1">Picked for GW{awayPickInfo.gameweek}</span>
                            )}
                            {awayPickInfo && awayPickInfo.gameweek < selectedGameweek && (
                              <span className="text-xs mt-1">Used in GW{awayPickInfo.gameweek}</span>
                            )}
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/70">No fixtures available for this gameweek</p>
            </div>
          )}

          {selectedTeam && (
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
              <p className="text-white">
                Selected: <span className="font-semibold text-[#00E5A0]">{selectedTeam}</span>
              </p>
              <Button
                onClick={handleMakePick}
                disabled={loading}
                className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90 font-semibold px-6 py-2"
              >
                {loading ? 'Making Pick...' : 'Confirm Pick'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Gameweek Status Overview */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Gameweek Status</h3>
        <div className="space-y-3">
          {getAvailableGameweeks()
            .slice(0, showAllGameweeks ? undefined : 8) // Show 8 by default, all if expanded
            .map((gw) => {
            const status = getPickStatus(gw.gw);
            const deadlinePassed = isDeadlinePassed(gw.gw);
            const result = getPickResult(gw.gw);
            
            return (
              <div key={gw.gw} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-white font-medium">Gameweek {gw.gw}</span>
                <div className="flex items-center gap-2">
                  {result === 'win' && (
                    <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle size={16} />
                      Won
                    </span>
                  )}
                  {result === 'lose' && (
                    <span className="flex items-center gap-2 text-red-400 text-sm font-medium">
                      <AlertCircle size={16} />
                      Lost
                    </span>
                  )}
                  {!result && status === 'picked' && (
                    <span className="flex items-center gap-2 text-[#00E5A0] text-sm font-medium">
                      <CheckCircle size={16} />
                      Picked
                    </span>
                  )}
                  {!result && status === 'awaiting' && (
                    <span className="flex items-center gap-2 text-[#C9B037] text-sm font-medium">
                      <Clock size={16} />
                      Awaiting Pick
                    </span>
                  )}
                  {deadlinePassed && !result && (
                    <span className="flex items-center gap-2 text-white/50 text-sm font-medium">
                      <AlertCircle size={16} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {getAvailableGameweeks().length > 8 && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setShowAllGameweeks(!showAllGameweeks)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {showAllGameweeks ? 'Show Less' : `Show More (${getAvailableGameweeks().length - 8} more)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}