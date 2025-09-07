import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { PickService } from '../../services/pickService';
import { FPLService } from '../../services/fplService';
import { Button } from '../ui/Button';
import { PREMIER_LEAGUE_TEAMS } from '../../types/database';

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

  useEffect(() => {
    loadUserPicks();
    loadGameweeks();
  }, [roomId]);

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
      // Filter to only show future gameweeks (not already finished)
      const futureGameweeks = gws.filter(gw => !gw.finished);
      setGameweeks(futureGameweeks);
    } catch (err) {
      console.error('Error loading gameweeks:', err);
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

  const getAvailableTeams = () => {
    const usedTeams = getUsedTeams();
    return PREMIER_LEAGUE_TEAMS.filter(team => !usedTeams.includes(team));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F8F8F6]">Make Your Picks</h2>
      
      {error && (
        <div className="bg-[#DC2626]/20 border border-[#DC2626] rounded-lg p-4">
          <p className="text-[#DC2626]">{error}</p>
        </div>
      )}

      {/* Historic Picks Bar */}
      {userPicks.length > 0 && (
        <div className="bg-[#262626] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-[#F8F8F6] mb-3">Your Picks</h3>
          <div className="flex flex-wrap gap-2">
            {userPicks
              .sort((a, b) => a.gameweek - b.gameweek)
              .map((pick) => (
                <div
                  key={pick.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    pick.is_locked 
                      ? 'bg-[#737373]/20 text-[#737373]' 
                      : 'bg-[#00E5A0]/20 text-[#00E5A0]'
                  }`}
                >
                  GW{pick.gameweek}: {pick.team_name}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Gameweek Selection */}
      <div className="bg-[#262626] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#F8F8F6] mb-3">Select Gameweek</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {gameweeks.slice(0, 8).map((gw) => {
            const status = getPickStatus(gw.gw);
            const deadlinePassed = isDeadlinePassed(gw.gw);
            
            return (
              <Button
                key={gw.gw}
                onClick={() => setSelectedGameweek(gw.gw)}
                disabled={deadlinePassed}
                className={`p-2 text-sm ${
                  selectedGameweek === gw.gw
                    ? 'bg-[#00E5A0] text-black'
                    : deadlinePassed
                    ? 'bg-[#404040] text-[#737373] cursor-not-allowed'
                    : status === 'picked'
                    ? 'bg-[#C9B037]/20 text-[#C9B037] border border-[#C9B037]'
                    : 'bg-[#171717] border border-[#404040] hover:border-[#737373]'
                }`}
              >
                GW{gw.gw}
                {status === 'picked' && <CheckCircle size={12} className="ml-1" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Team Selection */}
      {selectedGameweek && !isDeadlinePassed(selectedGameweek) && (
        <div className="bg-[#262626] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-[#F8F8F6] mb-3">
            Select Team for Gameweek {selectedGameweek}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {getAvailableTeams().map((team) => (
              <Button
                key={team}
                onClick={() => setSelectedTeam(team)}
                disabled={loading}
                className={`p-2 text-sm ${
                  selectedTeam === team
                    ? 'bg-[#00E5A0] text-black'
                    : 'bg-[#171717] border border-[#404040] hover:border-[#737373]'
                }`}
              >
                {team}
              </Button>
            ))}
          </div>

          {selectedTeam && (
            <div className="flex items-center gap-4">
              <p className="text-[#F8F8F6]">
                Selected: <span className="font-semibold text-[#00E5A0]">{selectedTeam}</span>
              </p>
              <Button
                onClick={handleMakePick}
                disabled={loading}
                className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
              >
                {loading ? 'Making Pick...' : 'Confirm Pick'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Gameweek Status Overview */}
      <div className="bg-[#262626] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#F8F8F6] mb-3">Gameweek Status</h3>
        <div className="space-y-2">
          {gameweeks.slice(0, 6).map((gw) => {
            const status = getPickStatus(gw.gw);
            const deadlinePassed = isDeadlinePassed(gw.gw);
            
            return (
              <div key={gw.gw} className="flex items-center justify-between">
                <span className="text-[#F8F8F6]">Gameweek {gw.gw}</span>
                <div className="flex items-center gap-2">
                  {status === 'picked' && (
                    <span className="flex items-center gap-1 text-[#00E5A0] text-sm">
                      <CheckCircle size={14} />
                      Picked
                    </span>
                  )}
                  {status === 'awaiting' && (
                    <span className="flex items-center gap-1 text-[#C9B037] text-sm">
                      <Clock size={14} />
                      Awaiting Pick
                    </span>
                  )}
                  {deadlinePassed && (
                    <span className="flex items-center gap-1 text-[#737373] text-sm">
                      <AlertCircle size={14} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}