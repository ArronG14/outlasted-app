import { supabase } from '../lib/supabase';

export interface WeeklyBriefData {
  nextGameweek: number;
  deadline: Date;
  userLastPick: string | null;
  isUserOutOfPicks: boolean;
  activeRoomsCount: number;
  totalPotValue: number;
  activePlayersCount: number;
}

export class WeeklyBriefService {
  /**
   * Get weekly brief data for the current user
   */
  static async getWeeklyBriefData(userId: string): Promise<WeeklyBriefData> {
    try {
      // Get next gameweek deadline
      const { data: nextGameweek, error: gwError } = await supabase
        .from('gameweeks')
        .select('gw, deadline_utc')
        .eq('is_finished', false)
        .order('gw', { ascending: true })
        .limit(1)
        .single();

      if (gwError || !nextGameweek) {
        throw new Error('No upcoming gameweek found');
      }

      // Get user's last pick
      const { data: lastPick, error: pickError } = await supabase
        .from('picks')
        .select('team_name, gameweek')
        .eq('player_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get user's active rooms and calculate stats
      const { data: userRooms, error: roomsError } = await supabase
        .from('room_players')
        .select(`
          room_id,
          rooms!inner(
            buy_in,
            current_players,
            max_players,
            status
          )
        `)
        .eq('player_id', userId)
        .eq('status', 'active')
        .eq('rooms.status', 'active');

      if (roomsError) {
        console.error('Error fetching user rooms:', roomsError);
      }

      // Calculate total pot value and active players
      let totalPotValue = 0;
      let activePlayersCount = 0;
      let activeRoomsCount = 0;

      if (userRooms) {
        activeRoomsCount = userRooms.length;
        userRooms.forEach((userRoom: any) => {
          const room = userRoom.rooms;
          totalPotValue += room.buy_in * room.current_players;
          activePlayersCount += room.current_players;
        });
      }

      // Check if user is out of picks (simplified logic)
      // In a real implementation, this would check against used teams per room
      const isUserOutOfPicks = false; // TODO: Implement proper logic

      return {
        nextGameweek: nextGameweek.gw,
        deadline: new Date(nextGameweek.deadline_utc),
        userLastPick: lastPick?.team_name || null,
        isUserOutOfPicks,
        activeRoomsCount,
        totalPotValue,
        activePlayersCount
      };
    } catch (error) {
      console.error('Error fetching weekly brief data:', error);
      throw error;
    }
  }

  /**
   * Check if weekly brief should be shown for this user
   */
  static async shouldShowWeeklyBrief(userId: string): Promise<boolean> {
    try {
      // Check if user has dismissed the brief for this gameweek
      const { data: nextGameweek } = await supabase
        .from('gameweeks')
        .select('gw')
        .eq('is_finished', false)
        .order('gw', { ascending: true })
        .limit(1)
        .single();

      if (!nextGameweek) return false;

      const dismissedKey = `weekly_brief_dismissed_gw${nextGameweek.gw}`;
      const dismissed = localStorage.getItem(dismissedKey);
      
      if (dismissed) return false;

      // Check if user has seen the brief for this gameweek
      const seenKey = `weekly_brief_seen_gw${nextGameweek.gw}`;
      const seen = localStorage.getItem(seenKey);
      
      return !seen;
    } catch (error) {
      console.error('Error checking weekly brief visibility:', error);
      return false;
    }
  }

  /**
   * Mark weekly brief as seen for this gameweek
   */
  static markWeeklyBriefAsSeen(gameweek: number): void {
    const seenKey = `weekly_brief_seen_gw${gameweek}`;
    localStorage.setItem(seenKey, 'true');
  }

  /**
   * Mark weekly brief as dismissed for this gameweek
   */
  static markWeeklyBriefAsDismissed(gameweek: number): void {
    const dismissedKey = `weekly_brief_dismissed_gw${gameweek}`;
    localStorage.setItem(dismissedKey, 'true');
  }
}
