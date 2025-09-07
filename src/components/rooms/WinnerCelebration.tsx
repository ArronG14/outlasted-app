import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Star, Gift, Users, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';

interface WinnerCelebrationProps {
  winnerName: string;
  prizeAmount: number;
  totalPlayers: number;
  gameweeksSurvived: number;
  onRematch: () => void;
  onLeave: () => void;
}

export function WinnerCelebration({ 
  winnerName, 
  prizeAmount, 
  totalPlayers, 
  gameweeksSurvived, 
  onRematch, 
  onLeave 
}: WinnerCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30 w-full max-w-lg relative overflow-hidden">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
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
          {/* Trophy Icon */}
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Trophy className="text-white" size={48} />
            </div>
            <Crown className="mx-auto text-yellow-400" size={32} />
          </div>

          {/* Winner Announcement */}
          <h1 className="text-3xl font-bold text-white mb-2">
            🎉 CONGRATULATIONS! 🎉
          </h1>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
            {winnerName}
          </h2>
          <p className="text-white/80 text-lg mb-6">
            You are the OUTLASTED champion!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="text-green-400" size={20} />
                <span className="text-white/70 text-sm">Prize Won</span>
              </div>
              <p className="text-2xl font-bold text-green-400">£{prizeAmount}</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="text-blue-400" size={20} />
                <span className="text-white/70 text-sm">Players Outlasted</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{totalPlayers - 1}</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 border border-white/20 col-span-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="text-yellow-400" size={20} />
                <span className="text-white/70 text-sm">Gameweeks Survived</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{gameweeksSurvived}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onRematch}
              className="w-full bg-gradient-to-r from-[#00E5A0] to-green-500 text-black hover:from-green-400 hover:to-green-600 font-semibold py-3 text-lg"
            >
              <Gift className="mr-2" size={20} />
              Rematch with Same Players
            </Button>
            
            <Button
              onClick={onLeave}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 font-semibold py-3"
            >
              Leave Room
            </Button>
          </div>

          {/* Celebration Message */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/70 text-sm">
              You've proven yourself as the ultimate Premier League survivor! 
              Your strategic picks and nerves of steel have paid off. 
              Well done, champion! 🏆
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
