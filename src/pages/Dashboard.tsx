import React, { useState } from 'react';
import { Clock, Users, Trophy, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NextDeadline } from '../components/dashboard/NextDeadline';
import { UpcomingFixtures } from '../components/dashboard/UpcomingFixtures';
import { CreateRoomForm } from '../components/rooms/CreateRoomForm';
import { JoinRoomModal } from '../components/rooms/JoinRoomModal';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const handleRoomCreated = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleRoomJoined = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#F8F8F6]">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#171717]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-[#00E5A0]">OUTLASTED</h1>
              <span className="text-[#737373]">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#D4D4D4]">Welcome, {user?.email}</span>
              <span className="text-[#D4D4D4]">
                Welcome, {profile?.display_name || user?.email?.split('@')[0] || 'Player'}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => setShowCreateRoom(true)}
            className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
          >
            <Plus size={20} />
            Create Room
          </Button>
          <Button 
            onClick={() => setShowJoinRoom(true)}
            variant="outline" 
            className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
          >
            Join Room
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <NextDeadline />
          <UpcomingFixtures />
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-[#C9B037]" size={24} />
              <h3 className="text-lg font-semibold">Total Wins</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{profile?.total_wins || 0}</p>
          </div>
          
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-[#C9B037]" size={24} />
              <h3 className="text-lg font-semibold">Total Earnings</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">£{profile?.total_earnings || 0}</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-[#3D5A80]" size={24} />
              <h3 className="text-lg font-semibold">Active Rooms</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{profile?.total_rooms || 0}</p>
          </div>
          
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-[#EE6C4D]" size={24} />
              <h3 className="text-lg font-semibold">Best Streak</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{profile?.best_streak || 0}</p>
          </div>
        </div>

        {/* Room Sections */}
        <div className="space-y-8">
          {/* Ongoing Games */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Ongoing Games</h2>
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <Clock className="mx-auto mb-4 text-[#737373]" size={48} />
              <p className="text-[#737373] text-lg">No ongoing games</p>
              <p className="text-[#737373] mt-2">Join or create a room to start playing</p>
            </div>
          </section>

          {/* Upcoming Games */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Upcoming Games</h2>
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <Users className="mx-auto mb-4 text-[#737373]" size={48} />
              <p className="text-[#737373] text-lg">No upcoming games</p>
              <p className="text-[#737373] mt-2">Rooms you've joined will appear here</p>
            </div>
          </section>

          {/* Previous Games */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-[#F8F8F6]">Previous Games</h2>
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <Trophy className="mx-auto mb-4 text-[#737373]" size={48} />
              <p className="text-[#737373] text-lg">No previous games</p>
              <p className="text-[#737373] mt-2">Your game history will appear here</p>
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomForm
          onClose={() => setShowCreateRoom(false)}
          onSuccess={handleRoomCreated}
        />
      )}

      {showJoinRoom && (
        <JoinRoomModal
          onClose={() => setShowJoinRoom(false)}
          onSuccess={handleRoomJoined}
        />
      )}
    </div>
  );
}