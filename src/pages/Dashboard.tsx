import React, { useState, useEffect } from 'react';
import { Clock, Users, Trophy, Plus, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NextDeadline } from '../components/dashboard/NextDeadline';
import { UpcomingFixtures } from '../components/dashboard/UpcomingFixtures';
import { ActiveRooms } from '../components/dashboard/ActiveRooms';
import { CreateRoomForm } from '../components/rooms/CreateRoomForm';
import { JoinRoomModal } from '../components/rooms/JoinRoomModal';
import { WeeklyBrief } from '../components/dashboard/WeeklyBrief';
import { useAuthSimple } from '../hooks/useAuthSimple';
import { useNavigate } from 'react-router-dom';
import { WeeklyBriefService, WeeklyBriefData } from '../services/weeklyBriefService';

export function Dashboard() {
  const { user, signOut } = useAuthSimple();
  const navigate = useNavigate();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showWeeklyBrief, setShowWeeklyBrief] = useState(false);
  const [weeklyBriefData, setWeeklyBriefData] = useState<WeeklyBriefData | null>(null);

  const handleRoomCreated = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleRoomJoined = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  // Check for weekly brief on component mount
  useEffect(() => {
    const checkWeeklyBrief = async () => {
      if (!user) return;

      try {
        const shouldShow = await WeeklyBriefService.shouldShowWeeklyBrief(user.id);
        if (shouldShow) {
          const data = await WeeklyBriefService.getWeeklyBriefData(user.id);
          setWeeklyBriefData(data);
          setShowWeeklyBrief(true);
          
          // Track analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'weekly_brief_shown');
          }
        }
      } catch (error) {
        console.error('Error checking weekly brief:', error);
      }
    };

    checkWeeklyBrief();
  }, [user]);

  const handleWeeklyBriefClose = () => {
    if (weeklyBriefData) {
      WeeklyBriefService.markWeeklyBriefAsSeen(weeklyBriefData.nextGameweek);
    }
    setShowWeeklyBrief(false);
  };

  const handleWeeklyBriefDontShowAgain = () => {
    if (weeklyBriefData) {
      WeeklyBriefService.markWeeklyBriefAsDismissed(weeklyBriefData.nextGameweek);
    }
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
              <span className="text-[#D4D4D4]">
                Welcome, {user?.email?.split('@')[0] || 'Player'}
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
          <Button 
            onClick={() => navigate('/fixtures')}
            variant="outline" 
            className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
          >
            <Calendar size={20} />
            View Fixtures
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
            <p className="text-3xl font-bold text-[#00E5A0]">0</p>
          </div>
          
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-[#C9B037]" size={24} />
              <h3 className="text-lg font-semibold">Total Earnings</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">£0</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-[#3D5A80]" size={24} />
              <h3 className="text-lg font-semibold">Active Rooms</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">0</p>
          </div>
          
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-[#EE6C4D]" size={24} />
              <h3 className="text-lg font-semibold">Best Streak</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">0</p>
          </div>
        </div>

        {/* Active Rooms */}
        <ActiveRooms />
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

      {/* Weekly Brief Modal */}
      {showWeeklyBrief && weeklyBriefData && (
        <WeeklyBrief
          isOpen={showWeeklyBrief}
          onClose={handleWeeklyBriefClose}
          onDontShowAgain={handleWeeklyBriefDontShowAgain}
          data={weeklyBriefData}
        />
      )}
    </div>
  );
}