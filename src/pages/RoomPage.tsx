import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, Copy, Crown, Settings, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GameweekFixtures } from '../components/rooms/GameweekFixtures';
import { PickInterface } from '../components/rooms/PickInterface';
import { DealSystem } from '../components/rooms/DealSystem';
import { WinnerCelebration } from '../components/rooms/WinnerCelebration';
import { RoomService } from '../services/roomService';
import { GameStateService } from '../services/gameStateService';
import { EliminationService } from '../services/eliminationService';
import { useAuth } from '../hooks/useAuth';

interface RoomDetails {
  id: string;
  name: string;
  description: string | null;
  buy_in: number;
  max_players: number;
  current_players: number;
  is_public: boolean;
  invite_code: string;
  host_id: string;
  current_gameweek: number;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  profiles: {
    display_name: string;
  };
  room_players: Array<{
    id: string;
    status: string;
    joined_at: string;
    profiles: {
      display_name: string;
      avatar_url: string | null;
    };
  }>;
}

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [winner, setWinner] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadRoomDetails();
      loadGameState();
    }
  }, [id]);

  useEffect(() => {
    if (room && gameState) {
      checkForWinner();
    }
  }, [room, gameState]);

  const loadRoomDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const roomData = await RoomService.getRoomDetails(id);
      setRoom(roomData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const loadGameState = async () => {
    if (!id) return;

    try {
      const state = await GameStateService.getGameState(id);
      setGameState(state);
    } catch (err) {
      console.error('Error loading game state:', err);
    }
  };

  const checkForWinner = () => {
    if (!room || !gameState) return;

    // Check if game is completed and there's only one active player
    if (gameState.status === 'completed' && gameState.active_players === 1) {
      const winnerPlayer = room.room_players.find(p => p.status === 'active');
      if (winnerPlayer) {
        setWinner({
          name: winnerPlayer.profiles.display_name,
          prize: room.buy_in * room.current_players,
          totalPlayers: room.current_players,
          gameweeksSurvived: room.current_gameweek
        });
        setShowWinnerCelebration(true);
      }
    }
  };

  const handleDealAccepted = () => {
    // Handle deal acceptance - split winnings
    console.log('Deal accepted - splitting winnings');
    // This would trigger the deal completion logic
  };

  const handleRematch = () => {
    // Reset room for rematch
    console.log('Starting rematch');
    setShowWinnerCelebration(false);
    // This would reset the room state
  };

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  const copyInviteLink = async () => {
    if (!room) return;

    const inviteLink = `${window.location.origin}/invite/${room.invite_code}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const isHost = user?.id === room?.host_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0]"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#DC2626] text-lg mb-4">{error || 'Room not found'}</p>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] text-[#F8F8F6]">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#171717]/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#F8F8F6]">{room.name}</h1>
                <div className="flex items-center gap-4 text-sm text-[#737373]">
                  <span>Code: {room.invite_code}</span>
                  <span>ID: {room.id.slice(0, 8)}...</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    room.status === 'waiting' ? 'bg-[#C9B037]/20 text-[#C9B037]' :
                    room.status === 'active' ? 'bg-[#00E5A0]/20 text-[#00E5A0]' :
                    'bg-[#737373]/20 text-[#737373]'
                  }`}>
                    {room.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {isHost && (
              <div className="flex items-center gap-2">
                <Crown className="text-[#C9B037]" size={20} />
                <span className="text-[#C9B037] font-medium">Host</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal System */}
            {gameState && (
              <DealSystem
                roomId={room.id}
                currentGameweek={room.current_gameweek}
                activePlayers={gameState.active_players}
                dealThreshold={room.deal_threshold}
                onDealAccepted={handleDealAccepted}
              />
            )}

            {/* Pick Interface */}
            <PickInterface 
              roomId={room.id}
              currentGameweek={room.current_gameweek}
              onPickMade={() => {
                // Refresh room data when a pick is made
                loadRoomDetails();
                loadGameState();
              }}
            />

            {/* Current Gameweek Fixtures */}
            {room.status === 'active' && (
              <GameweekFixtures
                gameweek={room.current_gameweek}
                // TODO: Add pick selection logic
                // onTeamSelect={handleTeamSelect}
                // selectedTeam={selectedTeam}
                // usedTeams={usedTeams}
              />
            )}

            {/* Room Info */}
            <div className="bg-[#262626] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Room Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="text-[#3D5A80]" size={20} />
                  <div>
                    <p className="text-[#737373] text-sm">Players</p>
                    <p className="text-[#F8F8F6] font-medium">
                      {room.current_players}/{room.max_players}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="text-[#00E5A0]" size={20} />
                  <div>
                    <p className="text-[#737373] text-sm">Buy-in</p>
                    <p className="text-[#F8F8F6] font-medium">£{room.buy_in}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Settings className="text-[#EE6C4D]" size={20} />
                  <div>
                    <p className="text-[#737373] text-sm">Visibility</p>
                    <p className="text-[#F8F8F6] font-medium">
                      {room.is_public ? 'Public' : 'Private'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Crown className="text-[#C9B037]" size={20} />
                  <div>
                    <p className="text-[#737373] text-sm">Host</p>
                    <p className="text-[#F8F8F6] font-medium">
                      {room.profiles.display_name}
                    </p>
                  </div>
                </div>
              </div>
              
              {room.description && (
                <div className="mt-4 pt-4 border-t border-[#404040]">
                  <p className="text-[#D4D4D4]">{room.description}</p>
                </div>
              )}
            </div>

            {/* Players List */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Players</h2>
                <div className="text-sm text-white/70">
                  <span className="text-[#00E5A0] font-semibold">
                    {room.room_players.filter(p => p.status === 'active').length}
                  </span> active / {room.current_players} total
                </div>
              </div>
              <div className="space-y-3">
                {room.room_players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {player.profiles.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {player.profiles.display_name}
                          {player.profiles.display_name === room.profiles.display_name && (
                            <Crown className="inline ml-2 text-[#C9B037]" size={16} />
                          )}
                        </p>
                        <p className="text-white/60 text-sm">
                          Joined {new Date(player.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Show current gameweek pick status */}
                      <span className="text-white/60 text-xs">
                        {player.status === 'active' ? 'Active' : 'Eliminated'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        player.status === 'active' ? 'bg-[#00E5A0]/20 text-[#00E5A0]' :
                        player.status === 'eliminated' ? 'bg-red-500/20 text-red-400' :
                        'bg-[#C9B037]/20 text-[#C9B037]'
                      }`}>
                        {player.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Panel */}
            {isHost && (
              <div className="bg-[#262626] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown className="text-[#C9B037]" size={20} />
                  Host Panel
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#737373] mb-2">
                      Invite Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/invite/${room.invite_code}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-[#171717] border border-[#404040] rounded text-sm text-[#D4D4D4]"
                      />
                      <Button
                        onClick={copyInviteLink}
                        size="sm"
                        className={`${
                          copySuccess 
                            ? 'bg-[#00E5A0] text-black' 
                            : 'bg-[#3D5A80] text-white hover:bg-[#3D5A80]/90'
                        }`}
                      >
                        {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#737373]">Room Code</p>
                      <p className="text-[#F8F8F6] font-mono">{room.invite_code}</p>
                    </div>
                    <div>
                      <p className="text-[#737373]">Room ID</p>
                      <p className="text-[#F8F8F6] font-mono">{room.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game Status */}
            <div className="bg-[#262626] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Game Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Status</span>
                  <span className={`font-medium ${
                    room.status === 'waiting' ? 'text-[#C9B037]' :
                    room.status === 'active' ? 'text-[#00E5A0]' :
                    'text-[#737373]'
                  }`}>
                    {room.status === 'waiting' ? 'Waiting for Players' :
                     room.status === 'active' ? 'Game Active' :
                     'Completed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Current Gameweek</span>
                  <span className="text-[#F8F8F6] font-medium">{room.current_gameweek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Prize Pool</span>
                  <span className="text-[#00E5A0] font-medium">
                    £{(room.buy_in * room.current_players).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Celebration Modal */}
      {showWinnerCelebration && winner && (
        <WinnerCelebration
          winnerName={winner.name}
          prizeAmount={winner.prize}
          totalPlayers={winner.totalPlayers}
          gameweeksSurvived={winner.gameweeksSurvived}
          onRematch={handleRematch}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}