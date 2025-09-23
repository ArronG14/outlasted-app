import React from 'react';
import { Target, Trophy, Crown } from 'lucide-react';
import { Hero } from '../components/landing/Hero';
import { FeatureCard } from '../components/landing/FeatureCard';
import { LoginForm } from '../components/auth/LoginForm';

interface LandingProps {
  nextUrl?: string | null;
}

export function Landing({ nextUrl }: LandingProps) {
  return (
    <div className="min-h-screen landing-bg relative overflow-hidden">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen">
          {/* Left Side - Hero Content */}
          <div className="space-y-16 relative z-10">
            <Hero />
            
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 w-full">
              <FeatureCard
                icon={<Target size={32} />}
                title="Smart Picks"
                description="Choose each week. Strategy decides how far you go."
              />
              <FeatureCard
                icon={<Trophy size={32} />}
                title="Season Glory"
                description="Climb the ladder, build streaks, and collect trophies each season."
              />
              <FeatureCard
                icon={<Crown size={32} />}
                title="Elite Community"
                description="Join public rooms, create private leagues, and spark exclusive rivalries."
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end relative z-10">
            <LoginForm nextUrl={nextUrl} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-white/20 relative z-10">
          <p className="landing-text-muted">
            © 2025 OUTLASTED. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <button className="landing-text-muted hover:landing-text-body transition-colors">
              Terms
            </button>
            <button className="landing-text-muted hover:landing-text-body transition-colors">
              Privacy
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}