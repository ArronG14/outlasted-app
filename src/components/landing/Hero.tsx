import React from 'react';

export function Hero() {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      {/* Premium Badge */}
      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 animate-float">
        <span className="text-2xl">👑</span>
        <span className="landing-text-primary font-medium">Premium Football Survival</span>
      </div>

      {/* Main Title */}
      <div className="space-y-6">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight landing-brand-jade animate-logo-glow">
          OUTLASTED
        </h1>
        
        <p className="text-xl md:text-2xl landing-text-body max-w-2xl mx-auto leading-relaxed animate-slide-up">
          Survive the week. Take the pot. Join the most exclusive football prediction survival game.
        </p>
      </div>
    </div>
  );
}