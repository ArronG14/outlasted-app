import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, Search, Globe, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RoomService } from '../../services/roomService';

interface JoinRoomModalProps {
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

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

export function JoinRoomModal({ onClose, onSuccess }: JoinRoomModalProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
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

  const handleJoinPublicRoom = async (roomId: string, roomPassword?: string) => {
    try {
      setLoading(true);
      setError('');
      await RoomService.joinRoomById(roomId, roomPassword);
      onSuccess(roomId);
      onClose();
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
      const result = await RoomService.joinRoomByCode(roomCode.trim(), password.trim() || undefined);
      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#404040]">
          <h2 className="text-2xl font-bold text-[#F8F8F6]">Join Room</h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#F8F8F6] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#404040]">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
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
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'public' ? (
            <div className="space-y-4">
              {loadingRooms ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E5A0] mx-auto"></div>
                  <p className="text-[#737373] mt-4">Loading public rooms...</p>
                </div>
              ) : publicRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="mx-auto mb-4 text-[#737373]" size={48} />
                  <p className="text-[#737373] text-lg">No public rooms available</p>
                  <p className="text-[#737373] mt-2">Create a room or join with a private code</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-[#171717] rounded-lg p-4 border border-[#404040] hover:border-[#737373] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#F8F8F6] mb-1">
                            {room.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-[#D4D4D4]">
                            <span className="flex items-center gap-1">
                              <Users size={16} />
                              {room.current_players}/{room.max_players} players
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign size={16} />
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
              <form onSubmit={handleJoinPrivateRoom} className="space-y-6">
                <div className="text-center mb-6">
                  <Lock className="mx-auto mb-4 text-[#737373]" size={48} />
                  <h3 className="text-xl font-semibold text-[#F8F8F6] mb-2">
                    Join Private Room
                  </h3>
                  <p className="text-[#737373]">
                    Enter the room code or ID to join a private room
                  </p>
                </div>

                <Input
                  label="Room Code or ID"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code (e.g. ABC123)"
                  className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
                  required
                />

                <Input
                  label="Room Password (if required)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password if room is locked"
                  className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
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
          )}
        </div>
      </div>
    </div>
  );
}