import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, Globe, Lock, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RoomService } from '../services/roomService';

interface PublicRoom {
  id: string;
  name: string;
  invite_code: string;
  buy_in: number;
  max_players: number;
  current_players: number;
  status: string;
  created_at: string;
  host_name: string;
}

export function JoinPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    if (activeTab === 'public') {
      loadPublicRooms();
    }
  }, [activeTab]);

  const loadPublicRooms = async () => {
    try {
      setLoadingRooms(true);
      const rooms = await RoomService.getPublicRooms();
      setPublicRooms(rooms);
    } catch (err) {
      console.error('Error loading public rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinPublicRoom = async (roomId: string) => {
    try {
      setLoading(true);
      setError('');
      await RoomService.joinRoomById(roomId);
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await RoomService.joinRoomByCode(roomCode.trim());
      navigate(`/rooms/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#F8F8F6]">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#171717]/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-[#00E5A0]">Join Room</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-[#404040] mb-8">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 max-w-xs px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'public'
                  ? 'text-[#00E5A0] border-b-2 border-[#00E5A0] bg-[#00E5A0]/5'
                  : 'text-[#737373] hover:text-[#D4D4D4]'
              }`}
            >
              <Globe size={20} className="inline mr-2" />
              Public Rooms
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 max-w-xs px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'private'
                  ? 'text-[#00E5A0] border-b-2 border-[#00E5A0] bg-[#00E5A0]/5'
                  : 'text-[#737373] hover:text-[#D4D4D4]'
              }`}
            >
              <Lock size={20} className="inline mr-2" />
              Private Room
            </button>
          </div>

          {/* Content */}
          {activeTab === 'public' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Available Public Rooms</h2>
                <Button
                  onClick={loadPublicRooms}
                  variant="outline"
                  size="sm"
                  className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
                >
                  Refresh
                </Button>
              </div>

              {loadingRooms ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0] mx-auto"></div>
                  <p className="text-[#737373] mt-4">Loading public rooms...</p>
                </div>
              ) : publicRooms.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="mx-auto mb-4 text-[#737373]" size={64} />
                  <p className="text-[#737373] text-xl">No public rooms available</p>
                  <p className="text-[#737373] mt-2">Create a room or join with a private code</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {publicRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-[#262626] rounded-xl p-6 border border-[#404040] hover:border-[#737373] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-[#F8F8F6] mb-2">
                            {room.name}
                          </h3>
                          <div className="flex items-center gap-6 text-[#D4D4D4]">
                            <span className="flex items-center gap-2">
                              <Users size={18} />
                              {room.current_players}/{room.max_players} players
                            </span>
                            <span className="flex items-center gap-2">
                              <DollarSign size={18} />
                              £{room.buy_in} buy-in
                            </span>
                            <span className="text-[#737373]">
                              Host: {room.host_name}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinPublicRoom(room.id)}
                          disabled={loading}
                          className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
                        >
                          Join Room
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="bg-[#262626] rounded-xl p-8">
                <div className="text-center mb-8">
                  <Lock className="mx-auto mb-4 text-[#737373]" size={64} />
                  <h2 className="text-2xl font-semibold text-[#F8F8F6] mb-2">
                    Join Private Room
                  </h2>
                  <p className="text-[#737373]">
                    Enter the room code or ID to join a private room
                  </p>
                </div>

                <form onSubmit={handleJoinPrivateRoom} className="space-y-6">
                  <Input
                    label="Room Code or ID"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code (e.g. ABC123)"
                    className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
                    required
                  />

                  {error && (
                    <div className="text-sm text-[#DC2626] bg-[#DC2626]/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
                    disabled={loading}
                  >
                    <Search size={20} />
                    {loading ? 'Joining...' : 'Join Room'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}