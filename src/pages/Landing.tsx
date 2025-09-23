import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSimple } from '../hooks/useAuthSimple';
import { Button } from '../components/ui/Button';

interface LandingProps {
  nextUrl?: string | null;
}

export function Landing({ nextUrl }: LandingProps) {
  const { user } = useAuthSimple();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Track landing view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'landing_view');
    }
  }, []);

  const handlePlayNowClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_play_click', {
        event_label: 'hero'
      });
    }
    const signupUrl = nextUrl ? `/signup?next=${encodeURIComponent(nextUrl)}` : '/signup';
    navigate(signupUrl);
  };

  const handleSignInClick = () => {
    navigate('/login');
  };

  const handleModePillClick = (mode: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'modes_pill_click', {
        event_category: 'modes',
        event_label: mode
      });
    }
    navigate('/signup?next=/modes');
  };

  const handleSeasonClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'season_cta_click');
    }
    navigate('/signup?next=/season');
  };

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00E5A0] to-[#00C896] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">O</span>
              </div>
              <span className="text-2xl font-bold text-stone-900">OUTLASTED</span>
            </div>
            <Button
              onClick={handleSignInClick}
              variant="outline"
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Sign in
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-full px-4 py-2 mb-6">
            <span className="text-lg">🔥</span>
            <span className="text-stone-700 font-medium">Premium Football Survival</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-stone-900 mb-6">
            OUTLASTED
          </h1>

          {/* Subhead */}
          <p className="text-xl md:text-2xl text-stone-600 mb-8 max-w-2xl mx-auto">
            Each week, make your pick. Survive the results. Outlast your mates.
          </p>

          {/* Primary CTA */}
          <Button
            onClick={handlePlayNowClick}
            className="bg-gradient-to-r from-[#00E5A0] to-[#00C896] text-black hover:from-[#00C896] hover:to-[#00B085] text-lg font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-[#00E5A0]/25 transition-all duration-300 transform hover:scale-105"
          >
            Play Now Free
          </Button>
        </div>
      </section>

      {/* 3-Step Explainer */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Pick */}
            <div className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-2xl p-8 hover:border-[#00E5A0]/30 hover:shadow-lg hover:shadow-[#00E5A0]/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00E5A0] to-[#00C896] rounded-xl flex items-center justify-center mb-6">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Pick</h3>
              <p className="text-stone-600 text-lg">
                Choose your team each gameweek. Your strategy decides how long you survive.
              </p>
            </div>

            {/* Survive */}
            <div className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-2xl p-8 hover:border-[#00E5A0]/30 hover:shadow-lg hover:shadow-[#00E5A0]/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00E5A0] to-[#00C896] rounded-xl flex items-center justify-center mb-6">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Survive</h3>
              <p className="text-stone-600 text-lg">
                Win and move on. Miss and you're in trouble — unless you've got a trick up your sleeve.
              </p>
            </div>

            {/* Outlast */}
            <div className="bg-white/80 backdrop-blur-sm border border-stone-200 rounded-2xl p-8 hover:border-[#00E5A0]/30 hover:shadow-lg hover:shadow-[#00E5A0]/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00E5A0] to-[#00C896] rounded-xl flex items-center justify-center mb-6">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Outlast</h3>
              <p className="text-stone-600 text-lg">
                Be the last one standing to claim the crown. Play again instantly when a season ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Strip */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-6">Game Modes</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <button
              onClick={() => handleModePillClick('Classic')}
              className="bg-white/80 border border-stone-200 rounded-full px-6 py-3 text-stone-700 hover:border-[#00E5A0]/30 hover:bg-[#00E5A0]/5 transition-all duration-300"
            >
              Classic
            </button>
            <button
              onClick={() => handleModePillClick('Chaos')}
              className="bg-white/80 border border-stone-200 rounded-full px-6 py-3 text-stone-700 hover:border-[#00E5A0]/30 hover:bg-[#00E5A0]/5 transition-all duration-300"
            >
              Chaos (Chips)
            </button>
            <button
              onClick={() => handleModePillClick('Predictor')}
              className="bg-white/80 border border-stone-200 rounded-full px-6 py-3 text-stone-700 hover:border-[#00E5A0]/30 hover:bg-[#00E5A0]/5 transition-all duration-300"
            >
              Predictor
            </button>
          </div>
          <p className="text-stone-500 text-lg">Start in Classic. Try Chaos when you're ready.</p>
        </div>
      </section>

      {/* Why Play */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">Why Play</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl">🏆</span>
              <div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Crowns & trophies on your profile</h3>
                <p className="text-stone-600">Build your legacy with every victory</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">👥</span>
              <div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Friends & public lobbies</h3>
                <p className="text-stone-600">Play with mates or meet new competitors</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Quick rematch at the end of a game</h3>
                <p className="text-stone-600">Keep the action going instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Twists & chips keep each season fresh</h3>
                <p className="text-stone-600">New strategies and surprises every season</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Season Banner */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#00E5A0]/10 to-[#00C896]/10 border border-[#00E5A0]/20 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#00E5A0]/20 border border-[#00E5A0]/30 rounded-full px-4 py-2 mb-4">
              <span className="text-[#00E5A0] font-semibold">Season Zero</span>
            </div>
            <p className="text-stone-700 text-lg mb-4">
              New twists and rewards each season keep the game fresh.
            </p>
            <button
              onClick={handleSeasonClick}
              className="text-[#00E5A0] hover:text-[#00C896] font-semibold transition-colors"
            >
              View season info →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-[#00E5A0] to-[#00C896] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">O</span>
              </div>
              <span className="text-stone-600">© 2024 OUTLASTED</span>
            </div>
            <div className="flex gap-6">
              <a href="/privacy" className="text-stone-600 hover:text-stone-900 transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-stone-600 hover:text-stone-900 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}