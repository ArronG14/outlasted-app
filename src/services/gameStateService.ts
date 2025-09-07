import { supabase } from '../lib/supabase';

export interface GameState {
  current_gameweek: number;
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
    const { data: room } = await supabase
      .from('rooms')
      .select('current_gameweek')
      .eq('id', roomId)
      .single();

    if (!room) return;

    const { data: nextGameweek } = await supabase
      .from('gameweeks')
      .select('gw')
      .gt('gw', room.current_gameweek)
      .eq('is_finished', false)
      .order('gw', { ascending: true })
      .limit(1);

    if (nextGameweek && nextGameweek.length > 0) {
      await supabase
        .from('rooms')
        .update({ 
          current_gameweek: nextGameweek[0].gw,
          status: 'active'
        })
        .eq('id', roomId);
    } else {
      await supabase
        .from('rooms')
        .update({ status: 'completed' })
        .eq('id', roomId);
    }
  }

  static async markRound1DeadlinePassed(roomId: string): Promise<void> {
    await supabase
      .from('rooms')
      .update({ 
        round_1_deadline_passed: true,
        status: 'active'
      })
      .eq('id', roomId);
  }
}
