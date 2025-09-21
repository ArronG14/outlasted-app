import { supabase } from '../lib/supabase';

export interface PlayerStatusInfo {
  status: 'awaiting_pick' | 'picked' | 'active' | 'eliminated';
  displayText: string;
  teamName?: string;
  gameweek?: number;
  isCurrentGameweek: boolean;
  deadlinePassed: boolean;
  gameweekFinished: boolean;
}

export class PlayerStatusService {
  /**
   * Get comprehensive player status for a specific gameweek
   */
  static async getPlayerStatus(
    roomId: string, 
    playerId: string, 
    gameweek: number
  ): Promise<PlayerStatusInfo> {
    // Get room info to check if this is the starting gameweek
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('current_gameweek, created_at')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      throw new Error('Room not found');
    }

    const isRoomStartingGameweek = gameweek === roomData.current_gameweek;

    // Get gameweek info
    const { data: gameweekData, error: gwError } = await supabase
      .from('gameweeks')
      .select('deadline_utc, is_finished')
      .eq('gw', gameweek)
      .single();

    if (gwError || !gameweekData) {
      throw new Error('Gameweek not found');
    }

    const deadline = new Date(gameweekData.deadline_utc);
    const now = new Date();
    const deadlinePassed = now > deadline;
    const gameweekFinished = gameweekData.is_finished;

    // Get player's pick for this gameweek
    const { data: pickData } = await supabase
      .from('picks')
      .select('team_name, result')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .eq('gameweek', gameweek)
      .single();

    // Get player's overall status
    const { data: playerData, error: playerError } = await supabase
      .from('room_players')
      .select('status')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .single();

    if (playerError || !playerData) {
      throw new Error('Player not found in room');
    }

    const playerStatus = playerData.status;
    const hasPick = !!pickData;
    const pickResult = pickData?.result;

    // Determine status based on gameweek state and player status
    let status: PlayerStatusInfo['status'];
    let displayText: string;
    let teamName: string | undefined;

    if (playerStatus === 'eliminated') {
      // Player is eliminated - always show eliminated status
      status = 'eliminated';
      displayText = 'Eliminated';
      if (hasPick && deadlinePassed) {
        teamName = pickData.team_name;
        displayText = `Eliminated (${pickData.team_name})`;
      }
    } else if (gameweekFinished) {
      // Gameweek is finished - show result
      if (hasPick) {
        teamName = pickData.team_name;
        if (pickResult === 'win') {
          status = 'active';
          displayText = 'Through'; // Changed to show "Through" for winners
        } else if (pickResult === 'lose') {
          status = 'eliminated';
          displayText = `Eliminated (${pickData.team_name})`;
        } else {
          status = 'eliminated'; // Draws are also eliminated
          displayText = `Eliminated (${pickData.team_name})`;
        }
      } else {
        status = 'eliminated';
        displayText = 'Eliminated (No Pick)';
      }
    } else if (deadlinePassed) {
      // Deadline passed but gameweek not finished - check if pick result is already determined
      if (hasPick) {
        // If pick result is already determined (win/lose/draw), show final status
        if (pickResult === 'win') {
          status = 'active';
          displayText = 'Through';
        } else if (pickResult === 'lose' || pickResult === 'draw') {
          status = 'eliminated';
          displayText = `Eliminated (${pickData.team_name})`;
        } else {
          // Pick result is still pending - show as pending
          status = 'picked';
          teamName = pickData.team_name;
          displayText = pickData.team_name;
        }
      } else {
        // Only mark as eliminated if this is the room's current gameweek
        // For new rooms, players shouldn't be penalized for not picking in previous gameweeks
        if (isRoomStartingGameweek) {
          status = 'eliminated';
          displayText = 'Eliminated (No Pick)';
        } else {
          // This is a past gameweek that the room didn't participate in
          status = 'awaiting_pick';
          displayText = 'Awaiting Pick';
        }
      }
    } else {
      // Before deadline - show pick status
      if (hasPick) {
        status = 'picked';
        teamName = pickData.team_name;
        displayText = 'Picked';
      } else {
        status = 'awaiting_pick';
        displayText = 'Awaiting Pick';
      }
    }

    return {
      status,
      displayText,
      teamName,
      gameweek,
      isCurrentGameweek: true, // This will be determined by caller
      deadlinePassed,
      gameweekFinished
    };
  }

  /**
   * Get all players' status for a specific gameweek
   */
  static async getAllPlayersStatus(
    roomId: string, 
    gameweek: number
  ): Promise<Array<{
    playerId: string;
    playerName: string;
    status: PlayerStatusInfo;
  }>> {
    // Get all players in the room
    const { data: players, error: playersError } = await supabase
      .from('room_players')
      .select(`
        player_id,
        profiles!inner(display_name)
      `)
      .eq('room_id', roomId);

    if (playersError || !players) {
      throw new Error('Failed to fetch players');
    }

    // Get status for each player
    const playerStatuses = await Promise.all(
      players.map(async (player) => {
        const status = await this.getPlayerStatus(roomId, player.player_id, gameweek);
        return {
          playerId: player.player_id,
          playerName: (player.profiles as any).display_name,
          status
        };
      })
    );

    return playerStatuses;
  }

  /**
   * Get player's historic picks for a room
   */
  static async getPlayerHistoricPicks(
    roomId: string, 
    playerId: string
  ): Promise<Array<{
    gameweek: number;
    teamName: string;
    result: string;
    deadline: Date;
    isFinished: boolean;
  }>> {
    const { data: picks, error } = await supabase
      .from('picks')
      .select(`
        gameweek,
        team_name,
        result,
        gameweeks!inner(deadline_utc, is_finished)
      `)
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .order('gameweek', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch historic picks');
    }

    return picks?.map(pick => ({
      gameweek: pick.gameweek,
      teamName: pick.team_name,
      result: pick.result,
      deadline: new Date((pick.gameweeks as any).deadline_utc),
      isFinished: (pick.gameweeks as any).is_finished
    })) || [];
  }
}
