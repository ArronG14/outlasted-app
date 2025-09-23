import React, { useState } from 'react';
import { X, Clock, Trophy, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface WeeklyBriefProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
  data: {
    nextGameweek: number;
    deadline: Date;
    userLastPick: string | null;
    isUserOutOfPicks: boolean;
    activeRoomsCount: number;
    totalPotValue: number;
    activePlayersCount: number;
  };
}

export function WeeklyBrief({ 
  isOpen, 
  onClose, 
  onDontShowAgain, 
  data 
}: WeeklyBriefProps) {
  const navigate = useNavigate();
  const [reminderSet, setReminderSet] = useState(false);

  if (!isOpen) return null;

  const formatTimeLeft = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Deadline passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  const formatDeadline = (deadline: Date) => {
    return deadline.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London'
    });
  };

  const handleMakePick = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'weekly_brief_primary_click');
    }
    
    // Navigate to dashboard where they can access rooms
    navigate('/dashboard');
    onClose();
  };

  const handleSetReminder = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'weekly_brief_reminder_set');
    }
    
    // Set local reminder (in a real app, this would schedule a push notification)
    const reminderTime = new Date(data.deadline.getTime() - 60 * 60 * 1000); // 1 hour before
    localStorage.setItem('weekly_brief_reminder', reminderTime.toISOString());
    setReminderSet(true);
  };

  const handleDismiss = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'weekly_brief_dismiss');
    }
    onClose();
  };

  const handleDontShowAgain = () => {
    onDontShowAgain();
    handleDismiss();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-xl w-full max-w-md border border-[#404040] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#404040]">
          <div>
            <h2 className="text-xl font-bold text-white">
              Gameweek {data.nextGameweek} starts in {formatTimeLeft(data.deadline)}
            </h2>
            {data.userLastPick && (
              <p className="text-[#737373] text-sm mt-1">
                Your last pick — {data.userLastPick}. Deadline: {formatDeadline(data.deadline)}.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#737373] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-[#404040]/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="text-[#C9B037]" size={16} />
              <span className="text-white text-sm font-medium">
                £{data.totalPotValue.toFixed(0)} pot
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-[#00E5A0]" size={16} />
              <span className="text-white text-sm font-medium">
                {data.activePlayersCount} players left
              </span>
            </div>
          </div>

          {/* Out of picks message */}
          {data.isUserOutOfPicks && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                You've used all allowed teams. Consider joining a rematch room or spectating.
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={handleMakePick}
              className="w-full bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90 font-semibold"
            >
              Make a Pick
            </Button>
            
            <button
              onClick={handleSetReminder}
              disabled={reminderSet}
              className="w-full text-[#00E5A0] hover:text-[#00E5A0]/80 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {reminderSet ? 'Reminder set ✓' : 'Remind me 1 hour before deadline'}
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-[#737373] hover:text-white transition-colors text-sm"
            >
              View my rooms →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <button
            onClick={handleDontShowAgain}
            className="text-[#737373] hover:text-white transition-colors text-xs"
          >
            Don't show again this week
          </button>
        </div>
      </div>
    </div>
  );
}
