import { supabase } from '../lib/supabase';

export interface GameState {
  current_gameweek: number;
  current_round: number;
  status: 'waiting' | 'active' | 'completed';
  round_1_deadline_passed: boolean;
  last_game_finished: boolean;
  active_players: number;
  total_players: number;
}

export class GameStateService {
  static async getGameState(roomId: string): Promise<GameState> {
    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        current_gameweek,
        current_round,
        status,
        round_1_deadline_passed,
        current_players,
        max_players
      `)
      .eq('id', roomId)
      .single();

    if (error) throw error;

    const { data: activePlayers } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'active');

    const lastGameFinished = await this.hasLastGameFinished(room.current_gameweek);

    return {
      current_gameweek: room.current_gameweek,
      current_round: room.current_round,
      status: room.status,
      round_1_deadline_passed: room.round_1_deadline_passed,
      last_game_finished: lastGameFinished,
      active_players: activePlayers?.length || 0,
      total_players: room.current_players,
    };
  }

  static async hasLastGameFinished(gameweek: number): Promise<boolean> {
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select('kickoff_utc')
      .eq('gw', gameweek)
      .order('kickoff_utc', { ascending: false })
      .limit(1);

    if (!fixtures || fixtures.length === 0) return false;

    const lastFixture = fixtures[0];
    const now = new Date();
    const kickoffTime = new Date(lastFixture.kickoff_utc);
    const gameEndTime = new Date(kickoffTime.getTime() + (2 * 60 * 60 * 1000));
    
    return now > gameEndTime;
  }

  static async arePicksLocked(gameweek: number): Promise<boolean> {
    const { data } = await supabase
      .from('gameweeks')
      .select('deadline_utc')
      .eq('gw', gameweek)
      .single();

    if (!data) return true;

    const deadline = new Date(data.deadline_utc);
    const now = new Date();
    return now > deadline;
  }

  static async advanceToNextGameweek(roomId: string): Promise<void> {
    // Use the database function for proper round tracking
    const { data, error } = await supabase.rpc('advance_to_next_round', {
      p_room_id: roomId
    });

    if (error) throw error;
  }

  static async markRound1DeadlinePassed(roomId: string): Promise<void> {
    // Use the database function for proper round tracking
    const { data, error } = await supabase.rpc('start_round_1', {
      p_room_id: roomId
    });

    if (error) throw error;
  }
}
