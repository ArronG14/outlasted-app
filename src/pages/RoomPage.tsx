import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Crown, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { GameweekFixtures } from '../components/rooms/GameweekFixtures';
import { PickInterface } from '../components/rooms/PickInterface';
import { DealSystem } from '../components/rooms/DealSystem';
import { WinnerCelebration } from '../components/rooms/WinnerCelebration';
import { LiveScores } from '../components/rooms/LiveScores';
import { RematchSystem } from '../components/rooms/RematchSystem';
import { AllPlayersEliminatedNotification } from '../components/rooms/AllPlayersEliminatedNotification';
import { RoomDebug } from '../components/debug/RoomDebug';
import { RoomService } from '../services/roomService';
import { GameStateService } from '../services/gameStateService';
import { PlayerStatusService } from '../services/playerStatusService';
import { RoomStatusService } from '../services/roomStatusService';
import { PlayerProfile } from '../components/rooms/PlayerProfile';
import { useAuthSimple } from '../hooks/useAuthSimple';

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
  current_round: number;
  status: 'waiting' | 'active' | 'completed';
  deal_threshold: number;
  created_at: string;
  profiles: {
    display_name: string;
  };
  room_players: Array<{
    id: string;
    player_id: string;
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
  const { user } = useAuthSimple();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [playerStatuses, setPlayerStatuses] = useState<Array<{
    playerId: string;
    playerName: string;
    status: any;
  }>>([]);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [roomStatus, setRoomStatus] = useState<any>(null);
  const [showAllEliminatedNotification, setShowAllEliminatedNotification] = useState(false);
  const [allEliminatedData, setAllEliminatedData] = useState<{gameweek: number, eliminatedCount: number} | null>(null);

  useEffect(() => {
    console.log('RoomPage mounted with ID:', id);
    if (id) {
      loadRoomDetails();
      loadGameState();
    } else {
      setError('No room ID provided');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (room && gameState) {
      checkForWinner();
    }
  }, [room, gameState]);

  // Auto-refresh data every 30 seconds to keep everything up-to-date
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      refreshAllData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const loadRoomDetails = async () => {
    if (!id) return;

    try {
      console.log('Loading room details for ID:', id);
      setLoading(true);
      setError('');
      const roomData = await RoomService.getRoomDetails(id);
      console.log('Room data loaded:', roomData);
      setRoom(roomData);
      
      // Load player statuses and room status for current gameweek
      if (roomData) {
        await loadPlayerStatuses(roomData.current_gameweek);
        await loadRoomStatus(roomData.id);
      }
    } catch (err) {
      console.error('Error loading room details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerStatuses = async (gameweek: number) => {
    if (!id) return;

    try {
      const statuses = await PlayerStatusService.getAllPlayersStatus(id, gameweek);
      setPlayerStatuses(statuses);
    } catch (err) {
      console.error('Error loading player statuses:', err);
    }
  };

  const loadRoomStatus = async (roomId: string) => {
    try {
      const status = await RoomStatusService.getRoomStatus(roomId);
      setRoomStatus(status);
    } catch (err) {
      console.error('Error loading room status:', err);
    }
  };

  const refreshAllData = async () => {
    if (!id) return;
    
    try {
      setRefreshing(true);
      // Reload room details and player statuses
      const roomData = await RoomService.getRoomDetails(id);
      setRoom(roomData);
      
      if (roomData) {
        await loadPlayerStatuses(roomData.current_gameweek);
        await loadRoomStatus(roomData.id);
        await loadGameState();
        
        // Check if all players were eliminated in the previous gameweek
        // This would be detected by the backend and we can show the notification
        // For now, we'll add a simple check - in a real implementation, 
        // this would be triggered by a WebSocket or polling mechanism
        checkForAllPlayersEliminated();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const checkForAllPlayersEliminated = () => {
    // This is a placeholder - in a real implementation, you would:
    // 1. Check if the room just had all players eliminated
    // 2. This could be done via a WebSocket event or by checking room history
    // 3. For now, we'll simulate this check
    
    // Example: If you want to test this, you could add a button or trigger
    // that sets the notification state manually
  };

  // Test function to manually trigger the all players eliminated notification
  const testAllPlayersEliminated = () => {
    setAllEliminatedData({
      gameweek: room?.current_gameweek || 1,
      eliminatedCount: room?.current_players || 3
    });
    setShowAllEliminatedNotification(true);
  };

  const getCurrentUserStatus = () => {
    if (!user || !room) return 'active' as const;
    
    const currentPlayer = room.room_players.find(p => p.player_id === user.id);
    const status = currentPlayer?.status || 'active';
    
    // Ensure the status is one of the expected values
    if (status === 'eliminated') return 'eliminated' as const;
    if (status === 'active') return 'active' as const;
    return 'pending_pick' as const;
  };

  const loadGameState = async () => {
    if (!id) return;

    try {
      console.log('Loading game state for ID:', id);
      const state = await GameStateService.getGameState(id);
      console.log('Game state loaded:', state);
      setGameState(state);
    } catch (err) {
      console.error('Error loading game state:', err);
      // Don't set error for game state, it's not critical
    }
  };

  const checkForWinner = () => {
    if (!room || !gameState) return;

    // Check if game is completed and there's only one active player
    if (gameState.status === 'completed' && gameState.active_players === 1) {
      const winnerPlayer = room.room_players.find(p => p.status === 'active');
      if (winnerPlayer) {
        setWinner(winnerPlayer);
        setShowWinnerCelebration(true);
      }
    }
  };

  const handleDealAccepted = () => {
    // Handle deal acceptance
    console.log('Deal accepted');
  };

  const handleRematch = () => {
    // Handle rematch
    console.log('Rematch initiated');
    setShowWinnerCelebration(false);
    loadRoomDetails();
    loadGameState();
  };

  const handleLeaveRoom = () => {
    // Handle leaving room
    console.log('Leaving room');
    navigate('/dashboard');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading room...</p>
          <p className="text-white/60 text-sm mt-2">Room ID: {id}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Room Not Found</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-white/60 text-sm">Room ID: {id}</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show room not found if no room data
  if (!room) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">Room Not Found</h2>
            <p className="text-yellow-300 mb-4">The room you're looking for doesn't exist or you don't have access to it.</p>
            <p className="text-white/60 text-sm">Room ID: {id}</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-border text-foreground hover:bg-accent/10 mr-4"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-card-foreground">{room.name}</h1>
                  {refreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Room Code: {room.invite_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                onClick={refreshAllData}
                variant="outline"
                className="border-border text-foreground hover:bg-accent/10"
                disabled={refreshing}
              >
                <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => copyToClipboard(`${window.location.origin}/rooms/${room.id}`)}
                variant="outline"
                className="border-border text-foreground hover:bg-accent/10"
              >
                <Copy size={16} className="mr-2" />
                {copySuccess ? 'Copied!' : 'Share'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Component - Remove this after fixing */}
        <RoomDebug roomId={room.id} />
        
        {/* Test Button for All Players Eliminated - Remove in production */}
        <div className="mb-4">
          <Button
            onClick={testAllPlayersEliminated}
            className="bg-orange-500 text-white hover:bg-orange-400"
          >
            Test All Players Eliminated Notification
          </Button>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Room Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Room Status */}
            <div className="bg-[#262626] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Room Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#D4D4D4]">Status:</span>
                  <span className={`font-medium ${
                    roomStatus?.status === 'waiting' ? 'text-yellow-400' :
                    roomStatus?.status === 'active' ? 'text-green-400' :
                    'text-blue-400'
                  }`}>
                    {roomStatus?.displayText || 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D4D4D4]">Current Gameweek:</span>
                  <span className="text-white font-medium">GW {room.current_gameweek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#D4D4D4]">Players:</span>
                  <span className="text-white font-medium">{room.current_players}/{room.max_players}</span>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-[#262626] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Players</h2>
              <div className="space-y-3">
                {playerStatuses.length > 0 ? (
                  playerStatuses.map((playerStatus) => {
                    const player = room.room_players.find(p => p.player_id === playerStatus.playerId);
                    if (!player) return null;
                    
                    return (
                      <PlayerProfile
                        key={player.id}
                        playerId={player.player_id}
                        playerName={playerStatus.playerName}
                        isHost={player.player_id === room.host_id}
                        roomId={room.id}
                        currentGameweek={room.current_gameweek}
                        playerStatus={playerStatus.status}
                        onDataRefresh={refreshAllData}
                      />
                    );
                  })
                ) : (
                  room.room_players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#404040] rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {player.profiles.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white">{player.profiles.display_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.player_id === room.host_id && (
                          <Crown className="text-yellow-400" size={16} />
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          player.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          player.status === 'eliminated' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {player.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Game Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pick Interface */}
            {room.status === 'waiting' || room.status === 'active' ? (
              <PickInterface
                roomId={room.id}
                currentGameweek={room.current_gameweek}
                onPickMade={refreshAllData}
                playerStatus={getCurrentUserStatus()}
              />
            ) : null}

            {/* Deal System */}
            {room.status === 'active' && gameState && (
              <DealSystem
                roomId={room.id}
                currentGameweek={room.current_gameweek}
                activePlayers={gameState.active_players}
                dealThreshold={room.deal_threshold}
                onDealAccepted={handleDealAccepted}
              />
            )}

            {/* Live Scores */}
            {room.status === 'active' && (
              <LiveScores
                gameweek={room.current_gameweek}
                roomId={room.id}
                onResultsUpdated={() => {
                  loadRoomDetails();
                  loadGameState();
                }}
              />
            )}

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

            {/* Rematch System */}
            {room.status === 'completed' && (
              <RematchSystem
                roomId={room.id}
                onRematchStarted={() => {
                  loadRoomDetails();
                  loadGameState();
                }}
              />
            )}

            {/* Room Info */}
            <div className="bg-[#262626] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Room Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#D4D4D4] mb-2">Buy-in</h3>
                  <p className="text-lg font-semibold">£{room.buy_in}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#D4D4D4] mb-2">Prize Pot</h3>
                  <p className="text-lg font-semibold">£{room.buy_in * room.current_players}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#D4D4D4] mb-2">Host</h3>
                  <p className="text-white">{room.profiles.display_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#D4D4D4] mb-2">Created</h3>
                  <p className="text-white">{new Date(room.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Players Eliminated Notification */}
      {showAllEliminatedNotification && allEliminatedData && (
        <AllPlayersEliminatedNotification
          gameweek={allEliminatedData.gameweek}
          eliminatedCount={allEliminatedData.eliminatedCount}
          onDismiss={() => {
            setShowAllEliminatedNotification(false);
            setAllEliminatedData(null);
            refreshAllData(); // Refresh to show updated room state
          }}
        />
      )}

      {/* Winner Celebration Modal */}
      {showWinnerCelebration && winner && (
        <WinnerCelebration
          winnerName={winner.profiles?.display_name || 'Winner'}
          prizeAmount={room.buy_in * room.current_players}
          totalPlayers={room.current_players}
          gameweeksSurvived={room.current_round || 1}
          onRematch={handleRematch}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}