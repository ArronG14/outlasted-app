import { useState, useEffect } from 'react';
import { Clock, Users, Trophy, Plus, Calendar, Target, AlertCircle } from 'lucide-react';
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
import { colors } from '../lib/design-tokens';

export function Dashboard() {
  const { user, signOut } = useAuthSimple();
  const navigate = useNavigate();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showWeeklyBrief, setShowWeeklyBrief] = useState(false);
  const [weeklyBriefData, setWeeklyBriefData] = useState<WeeklyBriefData | null>(null);
  
  // User stats state
  const [userStats, setUserStats] = useState({
    outlastedCount: 0,
    totalWins: 0,
    activeRooms: 0,
    bestStreak: 0
  });
  
  // Pick status state
  const [needsPick, setNeedsPick] = useState<{
    gameweek: number;
    hasPick: boolean;
  } | null>(null);

  const handleRoomCreated = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleRoomJoined = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  // Load user stats and check pick status
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // TODO: Implement actual API calls to get user stats
        // For now, using placeholder data
        setUserStats({
          outlastedCount: 0,
          totalWins: 0,
          activeRooms: 0,
          bestStreak: 0
        });

        // TODO: Check if user needs to make a pick for current gameweek
        // For now, placeholder logic
        setNeedsPick(null);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

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
        {/* Top Action Bar */}
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

        {/* Pick Banner - Conditional */}
        {needsPick && !needsPick.hasPick && (
          <div className="bg-gradient-to-r from-[#00E5A0]/10 to-[#3D5A80]/10 border border-[#00E5A0]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-[#00E5A0]" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-[#F8F8F6]">
                    Gameweek {needsPick.gameweek} is live — make your pick
                  </h3>
                  <p className="text-[#D4D4D4] text-sm">
                    Don't miss out on this week's action
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/fixtures')}
                  variant="outline"
                  className="border-[#262626] text-[#D4D4D4] hover:bg-[#262626]"
                >
                  View Fixtures
                </Button>
                <Button 
                  onClick={() => navigate('/fixtures')}
                  className="bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
                >
                  Make Pick
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - Row 1: 4-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NextDeadline />
          <UpcomingFixtures />
          
          {/* Total Wins Card */}
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-[#C9B037]" size={24} />
              <h3 className="text-lg font-semibold">Total Wins</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{userStats.totalWins}</p>
            <p className="text-sm text-[#737373] mt-1">Top 3 in 10+ player rooms</p>
          </div>
          
          {/* OUTLASTED Card */}
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-[#3D5A80]" size={24} />
              <h3 className="text-lg font-semibold" style={{ color: colors.secondary }}>OUTLASTED</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{userStats.outlastedCount}</p>
            <p className="text-sm text-[#737373] mt-1">1st place finishes</p>
          </div>
        </div>

        {/* Stats Grid - Row 2: 2-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-[#3D5A80]" size={24} />
              <h3 className="text-lg font-semibold">Active Rooms</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{userStats.activeRooms}</p>
            <p className="text-sm text-[#737373] mt-1">Rooms you're playing in</p>
          </div>
          
          <div className="bg-[#262626] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-[#EE6C4D]" size={24} />
              <h3 className="text-lg font-semibold">Best Streak</h3>
            </div>
            <p className="text-3xl font-bold text-[#00E5A0]">{userStats.bestStreak}</p>
            <p className="text-sm text-[#737373] mt-1">Consecutive wins</p>
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