import { supabase } from '../lib/supabase';

export interface LiveScore {
  fixture_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'finished';
  kickoff_utc: string;
  gameweek: number;
}

export interface TeamResult {
  team_name: string;
  result: 'win' | 'lose' | 'draw';
  score: string;
  opponent: string;
}

export class LiveScoreService {
  /**
   * Fetch live scores from Supabase database (synced by GitHub Actions)
   */
  static async fetchLiveScores(): Promise<LiveScore[]> {
    try {
      const { data: fixtures, error } = await supabase
        .from('fixtures')
        .select(`
          fixture_id,
          gw,
          kickoff_utc,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status
        `)
        .order('fixture_id', { ascending: true });
      
      if (error) throw error;
      
      // Transform database data to our format
      return (fixtures || []).map((fixture: any) => ({
        fixture_id: fixture.fixture_id,
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        home_score: fixture.home_score,
        away_score: fixture.away_score,
        status: fixture.status || 'scheduled',
        kickoff_utc: fixture.kickoff_utc,
        gameweek: fixture.gw
      }));
    } catch (error) {
      console.error('Error fetching live scores from database:', error);
      throw error;
    }
  }

  /**
   * Map FPL status to our status
   */
  private static mapFPLStatus(finished: boolean, started: boolean): 'scheduled' | 'live' | 'finished' {
    if (finished) return 'finished';
    if (started) return 'live';
    return 'scheduled';
  }

  /**
   * Get team results for a specific gameweek
   */
  static async getGameweekResults(gameweek: number): Promise<TeamResult[]> {
    const liveScores = await this.fetchLiveScores();
    const gameweekFixtures = liveScores.filter(score => score.gameweek === gameweek);
    
    // Get team names from database
    const { data: teams } = await supabase
      .from('pl_teams')
      .select('team_id, name');
    
    const teamMap = new Map(teams?.map(t => [t.team_id, t.name]) || []);
    
    const results: TeamResult[] = [];
    
    for (const fixture of gameweekFixtures) {
      if (fixture.status === 'finished' && fixture.home_score !== null && fixture.away_score !== null) {
        const homeTeamName = teamMap.get(fixture.home_team_id);
        const awayTeamName = teamMap.get(fixture.away_team_id);
        
        if (homeTeamName && awayTeamName) {
          // Home team result
          const homeResult = this.determineResult(fixture.home_score, fixture.away_score);
          results.push({
            team_name: homeTeamName,
            result: homeResult,
            score: `${fixture.home_score}-${fixture.away_score}`,
            opponent: awayTeamName
          });
          
          // Away team result
          const awayResult = this.determineResult(fixture.away_score, fixture.home_score);
          results.push({
            team_name: awayTeamName,
            result: awayResult,
            score: `${fixture.away_score}-${fixture.home_score}`,
            opponent: homeTeamName
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Determine if a team won, lost, or drew
   */
  private static determineResult(teamScore: number, opponentScore: number): 'win' | 'lose' | 'draw' {
    if (teamScore > opponentScore) return 'win';
    if (teamScore < opponentScore) return 'lose';
    return 'draw';
  }

  /**
   * Check if all games in a gameweek are finished
   */
  static async isGameweekFinished(gameweek: number): Promise<boolean> {
    const liveScores = await this.fetchLiveScores();
    const gameweekFixtures = liveScores.filter(score => score.gameweek === gameweek);
    
    if (gameweekFixtures.length === 0) return false;
    
    return gameweekFixtures.every(fixture => fixture.status === 'finished');
  }

  /**
   * Process gameweek results and eliminate losing players
   */
  static async processGameweekResults(roomId: string, gameweek: number): Promise<{
    eliminated_count: number;
    remaining_active: number;
    results: TeamResult[];
  }> {
    try {
      // Get team results for the gameweek
      const teamResults = await this.getGameweekResults(gameweek);
      
      // Get all picks for this room and gameweek
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .eq('room_id', roomId)
        .eq('gameweek', gameweek);
      
      if (picksError) throw picksError;
      
      let eliminatedCount = 0;
      const results: TeamResult[] = [];
      
      // Process each pick
      for (const pick of picks || []) {
        const teamResult = teamResults.find(result => result.team_name === pick.team_name);
        
        if (teamResult) {
          // Update pick with result
          const { error: updateError } = await supabase
            .from('picks')
            .update({ 
              result: teamResult.result,
              is_locked: true
            })
            .eq('id', pick.id);
          
          if (updateError) throw updateError;
          
          results.push(teamResult);
          
          // If team lost, eliminate player
          if (teamResult.result === 'lose') {
            const { error: eliminateError } = await supabase
              .from('room_players')
              .update({
                status: 'eliminated',
                eliminated_at: new Date().toISOString(),
                eliminated_gameweek: gameweek
              })
              .eq('room_id', roomId)
              .eq('player_id', pick.player_id)
              .eq('status', 'active');
            
            if (eliminateError) throw eliminateError;
            eliminatedCount++;
          }
        }
      }
      
      // Update active player count
      const { data: activePlayers } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', roomId)
        .eq('status', 'active');
      
      const remainingActive = activePlayers?.length || 0;
      
      // Update room player count
      await supabase
        .from('rooms')
        .update({ current_players: remainingActive })
        .eq('id', roomId);
      
      return {
        eliminated_count: eliminatedCount,
        remaining_active: remainingActive,
        results
      };
    } catch (error) {
      console.error('Error processing gameweek results:', error);
      throw error;
    }
  }

  /**
   * Get live scores for a specific gameweek
   */
  static async getGameweekLiveScores(gameweek: number): Promise<LiveScore[]> {
    const liveScores = await this.fetchLiveScores();
    return liveScores.filter(score => score.gameweek === gameweek);
  }

  /**
   * Check if a specific fixture is finished
   */
  static async isFixtureFinished(fixtureId: number): Promise<boolean> {
    const liveScores = await this.fetchLiveScores();
    const fixture = liveScores.find(score => score.fixture_id === fixtureId);
    return fixture?.status === 'finished' || false;
  }

  /**
   * Get next gameweek deadline
   */
  static async getNextDeadline(): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('gameweeks')
        .select('deadline_utc')
        .eq('is_finished', false)
        .order('gw', { ascending: true })
        .limit(1);
      
      if (error || !data || data.length === 0) return null;
      
      return new Date(data[0].deadline_utc);
    } catch (error) {
      console.error('Error getting next deadline:', error);
      return null;
    }
  }

  /**
   * Update gameweek status in database
   */
  static async updateGameweekStatus(gameweek: number, isFinished: boolean): Promise<void> {
    const { error } = await supabase
      .from('gameweeks')
      .update({ is_finished: isFinished })
      .eq('gw', gameweek);
    
    if (error) throw error;
  }
}
