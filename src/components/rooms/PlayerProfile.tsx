import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Crown, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PlayerStatusService } from '../../services/playerStatusService';

interface PlayerProfileProps {
  playerId: string;
  playerName: string;
  isHost: boolean;
  roomId: string;
  currentGameweek: number;
  playerStatus: {
    status: 'awaiting_pick' | 'picked' | 'active' | 'eliminated';
    displayText: string;
    teamName?: string;
  };
}

export function PlayerProfile({ 
  playerId, 
  playerName, 
  isHost, 
  roomId, 
  currentGameweek,
  playerStatus 
}: PlayerProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [historicPicks, setHistoricPicks] = useState<Array<{
    gameweek: number;
    teamName: string;
    result: string;
    deadline: Date;
    isFinished: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const loadHistoricPicks = async () => {
    if (isExpanded && historicPicks.length === 0) {
      setLoading(true);
      try {
        const picks = await PlayerStatusService.getPlayerHistoricPicks(roomId, playerId);
        setHistoricPicks(picks);
      } catch (error) {
        console.error('Failed to load historic picks:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadHistoricPicks();
  }, [isExpanded, roomId, playerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'eliminated':
        return 'bg-red-500/20 text-red-400';
      case 'picked':
        return 'bg-blue-500/20 text-blue-400';
      case 'awaiting_pick':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'lose':
        return <XCircle className="text-red-400" size={16} />;
      case 'draw':
        return <Clock className="text-yellow-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'text-green-400';
      case 'lose':
        return 'text-red-400';
      case 'draw':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#262626] rounded-lg p-4 border border-[#404040]">
      {/* Player Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#404040] rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {playerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{playerName}</span>
              {isHost && <Crown className="text-yellow-400" size={16} />}
            </div>
            <div className="text-xs text-[#737373]">
              {playerStatus.teamName && `Current: ${playerStatus.teamName}`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(playerStatus.status)}`}>
            {playerStatus.displayText}
          </span>
          {isExpanded ? (
            <ChevronUp className="text-[#737373]" size={16} />
          ) : (
            <ChevronDown className="text-[#737373]" size={16} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#404040]">
          <h4 className="text-sm font-medium text-[#D4D4D4] mb-3">Historic Picks</h4>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00E5A0] mx-auto"></div>
              <p className="text-[#737373] text-sm mt-2">Loading picks...</p>
            </div>
          ) : historicPicks.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="mx-auto mb-2 text-[#737373]" size={24} />
              <p className="text-[#737373] text-sm">No picks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historicPicks.map((pick) => (
                <div 
                  key={pick.gameweek} 
                  className={`flex items-center justify-between p-2 rounded ${
                    pick.gameweek === currentGameweek ? 'bg-[#00E5A0]/10 border border-[#00E5A0]/30' : 'bg-[#404040]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#D4D4D4]">
                        GW{pick.gameweek}
                      </span>
                      {pick.gameweek === currentGameweek && (
                        <span className="text-xs text-[#00E5A0] font-medium">Current</span>
                      )}
                    </div>
                    <span className="text-sm text-white">{pick.teamName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {pick.isFinished ? (
                      <>
                        {getResultIcon(pick.result)}
                        <span className={`text-xs font-medium ${getResultColor(pick.result)}`}>
                          {pick.result === 'win' ? 'Won' : 
                           pick.result === 'lose' ? 'Lost' : 
                           pick.result === 'draw' ? 'Draw' : 'Pending'}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="text-[#737373]" size={14} />
                        <span className="text-xs text-[#737373]">
                          {pick.deadline.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
