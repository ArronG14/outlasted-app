import { supabase } from '../lib/supabase';
import { Pick, PREMIER_LEAGUE_TEAMS } from '../types/database';

export class PickService {
  static async makePick(roomId: string, gameweek: number, teamName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate team name
    if (!PREMIER_LEAGUE_TEAMS.includes(teamName as any)) {
      throw new Error('Invalid team selection');
    }

    // Check if user already picked this team in this room
    const { data: existingPicks } = await supabase
      .from('picks')
      .select('team_name')
      .eq('room_id', roomId)
      .eq('player_id', user.id);

    const usedTeams = existingPicks?.map(pick => pick.team_name) || [];
    if (usedTeams.includes(teamName)) {
      throw new Error('You have already picked this team in this room');
    }

    // Check if picks are locked for this gameweek
    const lockTime = await this.getPickLockTime(gameweek);
    if (new Date() > lockTime) {
      throw new Error('Picks are locked for this gameweek');
    }

    const { data, error } = await supabase
      .from('picks')
      .upsert({
        room_id: roomId,
        player_id: user.id,
        gameweek,
        team_name: teamName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserPicks(roomId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('room_id', roomId)
      .eq('player_id', user.id)
      .order('gameweek', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getRoomPicks(roomId: string, gameweek?: number) {
    let query = supabase
      .from('picks')
      .select(`
        *,
        profiles (display_name, avatar_url)
      `)
      .eq('room_id', roomId);

    if (gameweek) {
      query = query.eq('gameweek', gameweek);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async getPickLockTime(gameweek: number): Promise<Date> {
    // Get the actual deadline from FPL API
    const { data, error } = await supabase
      .from('gameweeks')
      .select('deadline_utc')
      .eq('gw', gameweek)
      .single();

    if (error || !data) {
      throw new Error(`Could not find deadline for gameweek ${gameweek}`);
    }

    const deadline = new Date(data.deadline_utc);
    // Lock picks 90 minutes before the deadline
    const lockTime = new Date(deadline.getTime() - 90 * 60 * 1000);
    return lockTime;
  }

  static getAvailableTeams(roomId: string, playerId: string): Promise<string[]> {
    // Returns teams not yet picked by this player in this room
    return supabase
      .from('picks')
      .select('team_name')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .then(({ data, error }) => {
        if (error) throw error;
        const usedTeams = data?.map(pick => pick.team_name) || [];
        return PREMIER_LEAGUE_TEAMS.filter(team => !usedTeams.includes(team));
      });
  }
}