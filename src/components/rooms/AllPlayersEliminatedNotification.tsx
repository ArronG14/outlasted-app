import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Users, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';

interface AllPlayersEliminatedNotificationProps {
  gameweek: number;
  eliminatedCount: number;
  onDismiss: () => void;
}

export function AllPlayersEliminatedNotification({ 
  gameweek, 
  eliminatedCount, 
  onDismiss 
}: AllPlayersEliminatedNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30 w-full max-w-lg relative overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        <div className="p-8 text-center relative z-10">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <AlertTriangle className="text-white" size={48} />
            </div>
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="text-orange-400" size={24} />
              <Trophy className="text-yellow-400" size={24} />
            </div>
          </div>

          {/* Notification */}
          <h1 className="text-3xl font-bold text-white mb-2">
            🚨 ALL ELIMINATED! 🎉
          </h1>
          <h2 className="text-2xl font-semibold text-orange-400 mb-4">
            Second Chance Granted
          </h2>
          <p className="text-white/80 text-lg mb-6">
            All {eliminatedCount} remaining players were eliminated in Round {gameweek}!
          </p>

          {/* Details */}
          <div className="bg-white/10 rounded-xl p-4 mb-8 border border-white/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="text-orange-400" size={20} />
              <span className="text-white/70 text-sm">Miracle Recovery</span>
            </div>
            <p className="text-orange-400 font-semibold">
              All eliminated players have been reactivated!
            </p>
            <p className="text-white/70 text-sm mt-2">
              The game continues to the next gameweek. 
              All players can now make picks for Round {gameweek + 1}.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onDismiss}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 font-semibold py-3 text-lg"
          >
            <RefreshCw className="mr-2" size={20} />
            Continue to Next Round
          </Button>

          {/* Message */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/70 text-sm">
              This is the only time eliminated players get a second chance! 
              Make your picks wisely for Round {gameweek + 1}. 🎯
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
