import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Radio } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ViewFixtures } from '../components/fixtures/ViewFixtures';
import { FPLService } from '../services/fplService';
import { Gameweek } from '../types/fpl';

export function FixturesPage() {
  const [currentGameweek, setCurrentGameweek] = useState<number>(1);
  const [availableGameweeks, setAvailableGameweeks] = useState<Gameweek[]>([]);
  const [currentOngoingGameweek, setCurrentOngoingGameweek] = useState<Gameweek | null>(null);
  const [nextDeadline, setNextDeadline] = useState<Gameweek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameweeks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all gameweeks
        const gameweeks = await FPLService.getGameweeks();
        setAvailableGameweeks(gameweeks);
        
        // Get current ongoing gameweek
        const ongoing = await FPLService.getCurrentOngoingGameweek();
        setCurrentOngoingGameweek(ongoing);
        
        // Get next deadline
        const next = await FPLService.getNextDeadline();
        setNextDeadline(next);
        
        // Set current gameweek to ongoing if available, otherwise next deadline
        if (ongoing) {
          setCurrentGameweek(ongoing.gw);
        } else if (next) {
          setCurrentGameweek(next.gw);
        } else if (gameweeks.length > 0) {
          setCurrentGameweek(gameweeks[0].gw);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch gameweeks');
      } finally {
        setLoading(false);
      }
    };

    fetchGameweeks();
  }, []);

  const handlePreviousGameweek = () => {
    const currentIndex = availableGameweeks.findIndex(gw => gw.gw === currentGameweek);
    if (currentIndex > 0) {
      setCurrentGameweek(availableGameweeks[currentIndex - 1].gw);
    }
  };

  const handleNextGameweek = () => {
    const currentIndex = availableGameweeks.findIndex(gw => gw.gw === currentGameweek);
    if (currentIndex < availableGameweeks.length - 1) {
      setCurrentGameweek(availableGameweeks[currentIndex + 1].gw);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handlePreviousGameweek();
    } else if (event.key === 'ArrowRight') {
      handleNextGameweek();
    }
  };

  const currentGwData = availableGameweeks.find(gw => gw.gw === currentGameweek);
  const currentIndex = availableGameweeks.findIndex(gw => gw.gw === currentGameweek);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background text-foreground"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">OUTLASTED</h1>
              <span className="text-muted-foreground">Fixtures</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="border-border text-foreground hover:bg-accent/10"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Gameweek Navigation */}
        <div className="bg-card p-6 rounded-xl mb-8 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-secondary" size={24} />
              <h2 className="text-xl font-semibold text-card-foreground">Premier League Fixtures</h2>
            </div>
            
            {/* Gameweek Selector */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePreviousGameweek}
                disabled={currentIndex <= 0}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent/10 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </Button>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  Gameweek {currentGameweek}
                </div>
                {currentGwData && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock size={14} />
                    <span>
                      Deadline: {new Date(currentGwData.deadline_utc).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/London'
                      })}
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleNextGameweek}
                disabled={currentIndex >= availableGameweeks.length - 1}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent/10 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Gameweek Status Indicators */}
          <div className="flex gap-4 text-sm">
            {currentOngoingGameweek && currentGameweek === currentOngoingGameweek.gw && (
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full flex items-center gap-1">
                <Radio className="animate-pulse" size={12} />
                Currently Ongoing
              </span>
            )}
            {nextDeadline && currentGameweek === nextDeadline.gw && !currentOngoingGameweek && (
              <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full">
                Next Deadline
              </span>
            )}
            {currentGwData?.is_finished && (
              <span className="px-3 py-1 bg-muted/20 text-muted-foreground rounded-full">
                Finished
              </span>
            )}
            {!currentOngoingGameweek && !nextDeadline && (
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full">
                Upcoming
              </span>
            )}
          </div>

          {/* Keyboard Navigation Hint */}
          <div className="mt-4 text-xs text-muted-foreground">
            💡 Use arrow keys (← →) to navigate between gameweeks
          </div>
        </div>

        {/* Fixtures */}
        <ViewFixtures gameweek={currentGameweek} />

        {/* Gameweek List */}
        {availableGameweeks.length > 1 && (
          <div className="mt-8 bg-[#262626] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">All Gameweeks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableGameweeks.map((gw) => (
                <button
                  key={gw.gw}
                  onClick={() => setCurrentGameweek(gw.gw)}
                  className={`p-3 rounded-lg border transition-all ${
                    gw.gw === currentGameweek
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : 'bg-[#171717] border-[#404040] text-[#F8F8F6] hover:border-[#00E5A0] hover:text-[#00E5A0]'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">GW {gw.gw}</div>
                    <div className="text-xs opacity-75">
                      {new Date(gw.deadline_utc).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
