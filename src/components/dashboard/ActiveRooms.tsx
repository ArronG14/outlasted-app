import React, { useState, useEffect } from 'react';
import { Users, Crown, ExternalLink, Clock, Trophy } from 'lucide-react';
import { RoomService } from '../../services/roomService';
import { useNavigate } from 'react-router-dom';

interface UserRoom {
  id: string;
  name: string;
  status: string;
  current_players: number;
  max_players: number;
  buy_in: number;
  is_public: boolean;
  host_id: string;
  created_at: string;
  current_gameweek: number;
}

export function ActiveRooms() {
  const [ongoingRooms, setOngoingRooms] = useState<UserRoom[]>([]);
  const [upcomingRooms, setUpcomingRooms] = useState<UserRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserRooms();
  }, []);

  const loadUserRooms = async () => {
    try {
      setLoading(true);
      const userRooms = await RoomService.getUserRooms();
      
      // Separate rooms by status
      const ongoing = userRooms.filter(room => 
        room.status === 'active' || 
        (room.status === 'waiting' && room.current_gameweek > 1)
      );
      
      const upcoming = userRooms.filter(room => 
        room.status === 'waiting' && room.current_gameweek === 1
      );
      
      setOngoingRooms(ongoing);
      setUpcomingRooms(upcoming);
    } catch (err) {
      console.error('Error loading user rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const RoomCard = ({ room, isHost }: { room: UserRoom; isHost: boolean }) => (
    <div
      className="bg-[#171717] rounded-lg p-4 border border-[#404040] hover:border-[#737373] transition-colors cursor-pointer"
      onClick={() => navigate(`/rooms/${room.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-[#F8F8F6]">
              {room.name}
            </h4>
            {isHost && (
              <Crown className="text-[#C9B037]" size={16} />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-[#D4D4D4]">
            <span className="flex items-center gap-1">
              <Users size={16} />
              {room.current_players}/{room.max_players}
            </span>
            <span>£{room.buy_in} buy-in</span>
            <span className={`px-2 py-1 rounded text-xs ${
              room.status === 'waiting' ? 'bg-[#C9B037]/20 text-[#C9B037]' :
              room.status === 'active' ? 'bg-[#00E5A0]/20 text-[#00E5A0]' :
              'bg-[#737373]/20 text-[#737373]'
            }`}>
              {room.status === 'waiting' && room.current_gameweek === 1 ? 'Round 1 Picks' :
               room.status === 'waiting' ? `Round ${room.current_gameweek} Picks` :
               room.status.toUpperCase()}
            </span>
          </div>
        </div>
        <ExternalLink className="text-[#737373]" size={16} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Ongoing Games</h2>
          <div className="bg-[#262626] rounded-xl p-8 text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-[#404040] rounded mb-4"></div>
              <div className="h-4 bg-[#404040] rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Upcoming Games</h2>
          <div className="bg-[#262626] rounded-xl p-8 text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-[#404040] rounded mb-4"></div>
              <div className="h-4 bg-[#404040] rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Ongoing Games */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Ongoing Games</h2>
        {ongoingRooms.length === 0 ? (
          <div className="bg-[#262626] rounded-xl p-8 text-center">
            <Clock className="mx-auto mb-4 text-[#737373]" size={48} />
            <p className="text-[#737373] text-lg">No ongoing games</p>
            <p className="text-[#737373] mt-2">Join or create a room to start playing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ongoingRooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                isHost={room.host_id === (ongoingRooms[0]?.host_id)} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Games */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Upcoming Games</h2>
        {upcomingRooms.length === 0 ? (
          <div className="bg-[#262626] rounded-xl p-8 text-center">
            <Users className="mx-auto mb-4 text-[#737373]" size={48} />
            <p className="text-[#737373] text-lg">No upcoming games</p>
            <p className="text-[#737373] mt-2">Rooms you've joined will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                isHost={room.host_id === (upcomingRooms[0]?.host_id)} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
