import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useNextDeadline } from '../../hooks/useFPLData';

export function NextDeadline() {
  const { deadline, loading, error } = useNextDeadline();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [currentDeadline, setCurrentDeadline] = useState(deadline);

  useEffect(() => {
    if (deadline) {
      setCurrentDeadline(deadline);
    }
  }, [deadline]);

  useEffect(() => {
    if (!currentDeadline) return;

    const updateCountdown = async () => {
      const now = new Date();
      const deadlineTime = new Date(currentDeadline.deadline_utc);
      const diff = deadlineTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Deadline has passed, try to get the next deadline
        try {
          const { FPLService } = await import('../../services/fplService');
          const nextDeadline = await FPLService.getNextDeadline();
          if (nextDeadline && nextDeadline.gw !== currentDeadline.gw) {
            // Update to next deadline
            setCurrentDeadline(nextDeadline);
            return;
          }
        } catch (err) {
          console.error('Error fetching next deadline:', err);
        }
        setTimeLeft('Deadline passed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentDeadline]);

  if (loading) {
    return (
      <div className="bg-[#262626] p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-[#C9B037]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">Next Deadline</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-[#404040] rounded mb-2"></div>
          <div className="h-4 bg-[#404040] rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !deadline) {
    return (
      <div className="bg-[#262626] p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="text-[#EE6C4D]" size={24} />
          <h3 className="text-lg font-semibold text-[#F8F8F6]">Next Deadline</h3>
        </div>
        <p className="text-[#737373]">Unable to load deadline</p>
      </div>
    );
  }

  const isUrgent = timeLeft.includes('h') && !timeLeft.includes('d') && parseInt(timeLeft) < 24;

  return (
    <div className="bg-[#262626] p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <Clock className={`${isUrgent ? 'text-[#EE6C4D]' : 'text-[#C9B037]'}`} size={24} />
        <h3 className="text-lg font-semibold text-[#F8F8F6]">Next Deadline</h3>
      </div>
      <div className="space-y-2">
        <p className={`text-2xl font-bold ${isUrgent ? 'text-[#EE6C4D]' : 'text-[#00E5A0]'}`}>
          {timeLeft}
        </p>
        <p className="text-[#737373] text-sm">
          Gameweek {currentDeadline?.gw || deadline?.gw} • {new Date((currentDeadline || deadline)?.deadline_utc).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
          })}
        </p>
      </div>
    </div>
  );
}