import { useState, useEffect } from 'react';
import { FPLService } from '../services/fplService';
import { Gameweek, Fixture, NextDeadline } from '../types/fpl';

export function useNextDeadline() {
  const [deadline, setDeadline] = useState<NextDeadline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FPLService.getNextDeadline();
        setDeadline(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deadline');
      } finally {
        setLoading(false);
      }
    };

    fetchDeadline();
    
    // Refresh every minute
    const interval = setInterval(fetchDeadline, 60000);
    return () => clearInterval(interval);
  }, []);

  return { deadline, loading, error };
}

export function useUpcomingFixtures(limit: number = 5) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current gameweek
        const currentGw = await FPLService.getCurrentGameweek();
        if (!currentGw) {
          setFixtures([]);
          return;
        }

        // Get fixtures for current gameweek
        const data = await FPLService.listFixtures(currentGw.gw);
        
        // Filter to upcoming fixtures and limit
        const now = new Date();
        const upcomingFixtures = data
          .filter(fixture => new Date(fixture.kickoff_utc) > now)
          .slice(0, limit);
        
        setFixtures(upcomingFixtures);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchFixtures, 300000);
    return () => clearInterval(interval);
  }, [limit]);

  return { fixtures, loading, error };
}

export function useGameweekFixtures(gw: number) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picksLocked, setPicksLocked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch fixtures and check if picks are locked
        const [fixturesData, locked] = await Promise.all([
          FPLService.listFixtures(gw),
          FPLService.arePicksLocked(gw)
        ]);
        
        setFixtures(fixturesData);
        setPicksLocked(locked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch gameweek data');
      } finally {
        setLoading(false);
      }
    };

    if (gw > 0) {
      fetchData();
    }
  }, [gw]);

  return { fixtures, picksLocked, loading, error };
}