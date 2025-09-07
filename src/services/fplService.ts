import { supabase } from '../lib/supabase';
import { PLTeam, Gameweek, Fixture, NextDeadline } from '../types/fpl';

export class FPLService {
  /**
   * Get all upcoming gameweeks (current and future)
   */
  static async listUpcomingGameweeks(): Promise<Gameweek[]> {
    const { data, error } = await supabase
      .from('gameweeks') // Fixed: was 'fpl_gameweeks', now 'gameweeks'
      .select('*')
      .eq('is_finished', false)
      .order('gw', { ascending: true });

    if (error) {
      console.error('Error fetching gameweeks:', error);
      throw new Error('Failed to fetch gameweeks');
    }

    return data || [];
  }

  /**
   * Get all gameweeks (for pick interface)
   */
  static async getGameweeks(): Promise<Gameweek[]> {
    const { data, error } = await supabase
      .from('gameweeks')
      .select('*')
      .order('gw', { ascending: true });

    if (error) {
      console.error('Error fetching gameweeks:', error);
      throw new Error('Failed to fetch gameweeks');
    }

    return data || [];
  }

  /**
   * Get fixtures for a specific gameweek with team information
   */
  static async listFixtures(gw: number): Promise<Fixture[]> {
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        fixture_id,
        gw,
        kickoff_utc,
        home_team_id,
        away_team_id,
        home_team:pl_teams!fixtures_home_team_id_fkey(team_id, name, short_name),
        away_team:pl_teams!fixtures_away_team_id_fkey(team_id, name, short_name)
      `)
      .eq('gw', gw)
      .order('kickoff_utc', { ascending: true });

    if (error) {
      console.error('Error fetching fixtures:', error);
      throw new Error(`Failed to fetch fixtures for gameweek ${gw}`);
    }

    return data || [];
  }

  /**
   * Get the next deadline (current or next gameweek)
   */
  static async getNextDeadline(): Promise<NextDeadline | null> {
    const { data, error } = await supabase
      .from('gameweeks') // Fixed: was 'fpl_gameweeks', now 'gameweeks'
      .select('gw, deadline_utc')
      .or('is_current.eq.true,is_next.eq.true')
      .eq('is_finished', false)
      .order('gw', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error fetching next deadline:', error);
      throw new Error('Failed to fetch next deadline');
    }

    return data;
  }

  /**
   * Get current gameweek
   */
  static async getCurrentGameweek(): Promise<Gameweek | null> {
    const { data, error } = await supabase
      .from('gameweeks') // Fixed: was 'fpl_gameweeks', now 'gameweeks'
      .select('*')
      .eq('is_current', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No current gameweek found
        return null;
      }
      console.error('Error fetching current gameweek:', error);
      throw new Error('Failed to fetch current gameweek');
    }

    return data;
  }

  /**
   * Get all Premier League teams
   */
  static async getAllTeams(): Promise<PLTeam[]> {
    const { data, error } = await supabase
      .from('pl_teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }

    return data || [];
  }

  /**
   * Check if picks are locked for a gameweek
   */
  static async arePicksLocked(gw: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('gameweeks') // Fixed: was 'fpl_gameweeks', now 'gameweeks'
      .select('deadline_utc')
      .eq('gw', gw)
      .single();

    if (error || !data) {
      console.error('Error checking pick lock status:', error);
      return true; // Default to locked if we can't determine
    }

    const deadline = new Date(data.deadline_utc);
    const now = new Date();
    
    return now > deadline;
  }

  /**
   * Get time until deadline for a gameweek
   */
  static async getTimeUntilDeadline(gw: number): Promise<number | null> {
    const { data, error } = await supabase
      .from('gameweeks') // Fixed: was 'fpl_gameweeks', now 'gameweeks'
      .select('deadline_utc')
      .eq('gw', gw)
      .single();

    if (error || !data) {
      console.error('Error fetching deadline:', error);
      return null;
    }

    const deadline = new Date(data.deadline_utc);
    const now = new Date();
    
    return deadline.getTime() - now.getTime();
  }
}