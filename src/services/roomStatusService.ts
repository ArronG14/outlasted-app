import { supabase } from '../lib/supabase';

export interface RoomStatusInfo {
  status: 'waiting' | 'active' | 'completed';
  displayText: string;
  isJoinable: boolean;
  currentRound: number;
  currentGameweek: number;
  deadlinePassed: boolean;
  gameweekFinished: boolean;
}

export class RoomStatusService {
  /**
   * Get comprehensive room status information
   */
  static async getRoomStatus(roomId: string): Promise<RoomStatusInfo> {
    // Get room data
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      throw new Error('Room not found');
    }

    // Get current gameweek deadline info
    const { data: gameweekData, error: gwError } = await supabase
      .from('gameweeks')
      .select('deadline_utc, is_finished')
      .eq('gw', room.current_gameweek)
      .single();

    if (gwError || !gameweekData) {
      throw new Error('Gameweek not found');
    }

    const deadline = new Date(gameweekData.deadline_utc);
    const now = new Date();
    const deadlinePassed = now > deadline;
    const gameweekFinished = gameweekData.is_finished;

    // Determine room status based on game state
    let status: RoomStatusInfo['status'];
    let displayText: string;
    let isJoinable: boolean;

    if (room.status === 'completed') {
      // Game is finished
      status = 'completed';
      displayText = 'Completed';
      isJoinable = false;
    } else if (room.current_round === 1) {
      // Round 1 logic
      if (!deadlinePassed) {
        // Before deadline - players can join and make picks
        status = 'waiting';
        displayText = 'Round 1 Picks';
        isJoinable = true;
      } else if (!gameweekFinished) {
        // After deadline but games not finished - room is active, not joinable
        status = 'active';
        displayText = 'Round 1 In Progress';
        isJoinable = false;
      } else {
        // Games finished - should advance to round 2
        status = 'waiting';
        displayText = 'Round 2 Picks';
        isJoinable = false; // Only existing players can continue
      }
    } else {
      // Round 2+ logic
      if (!deadlinePassed) {
        // Before deadline - active players can make picks
        status = 'waiting';
        displayText = `Round ${room.current_round} Picks`;
        isJoinable = false;
      } else if (!gameweekFinished) {
        // After deadline but games not finished
        status = 'active';
        displayText = `Round ${room.current_round} In Progress`;
        isJoinable = false;
      } else {
        // Games finished - should advance to next round
        status = 'waiting';
        displayText = `Round ${room.current_round + 1} Picks`;
        isJoinable = false;
      }
    }

    return {
      status,
      displayText,
      isJoinable,
      currentRound: room.current_round,
      currentGameweek: room.current_gameweek,
      deadlinePassed,
      gameweekFinished
    };
  }

  /**
   * Get room status for multiple rooms efficiently
   */
  static async getMultipleRoomStatuses(roomIds: string[]): Promise<Map<string, RoomStatusInfo>> {
    const statusMap = new Map<string, RoomStatusInfo>();
    
    // Get all rooms data
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', roomIds);

    if (roomsError || !rooms) {
      throw new Error('Failed to fetch rooms');
    }

    // Get all gameweeks data for these rooms
    const gameweekIds = [...new Set(rooms.map(r => r.current_gameweek))];
    const { data: gameweeks, error: gwError } = await supabase
      .from('gameweeks')
      .select('gw, deadline_utc, is_finished')
      .in('gw', gameweekIds);

    if (gwError || !gameweeks) {
      throw new Error('Failed to fetch gameweeks');
    }

    const gameweekMap = new Map(gameweeks.map(gw => [gw.gw, gw]));

    // Calculate status for each room
    for (const room of rooms) {
      const gameweekData = gameweekMap.get(room.current_gameweek);
      if (!gameweekData) continue;

      const deadline = new Date(gameweekData.deadline_utc);
      const now = new Date();
      const deadlinePassed = now > deadline;
      const gameweekFinished = gameweekData.is_finished;

      let status: RoomStatusInfo['status'];
      let displayText: string;
      let isJoinable: boolean;

      if (room.status === 'completed') {
        status = 'completed';
        displayText = 'Completed';
        isJoinable = false;
      } else if (room.current_round === 1) {
        if (!deadlinePassed) {
          status = 'waiting';
          displayText = 'Round 1 Picks';
          isJoinable = true;
        } else if (!gameweekFinished) {
          status = 'active';
          displayText = 'Round 1 In Progress';
          isJoinable = false;
        } else {
          status = 'waiting';
          displayText = 'Round 2 Picks';
          isJoinable = false;
        }
      } else {
        if (!deadlinePassed) {
          status = 'waiting';
          displayText = `Round ${room.current_round} Picks`;
          isJoinable = false;
        } else if (!gameweekFinished) {
          status = 'active';
          displayText = `Round ${room.current_round} In Progress`;
          isJoinable = false;
        } else {
          status = 'waiting';
          displayText = `Round ${room.current_round + 1} Picks`;
          isJoinable = false;
        }
      }

      statusMap.set(room.id, {
        status,
        displayText,
        isJoinable,
        currentRound: room.current_round,
        currentGameweek: room.current_gameweek,
        deadlinePassed,
        gameweekFinished
      });
    }

    return statusMap;
  }

  /**
   * Update room status based on current game state
   */
  static async updateRoomStatus(roomId: string): Promise<RoomStatusInfo> {
    const statusInfo = await this.getRoomStatus(roomId);
    
    // Update room status in database if needed
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ 
        status: statusInfo.status,
        round_1_deadline_passed: statusInfo.deadlinePassed && statusInfo.currentRound === 1
      })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating room status:', updateError);
    }

    return statusInfo;
  }

  /**
   * Check if a room should advance to the next round
   */
  static async shouldAdvanceRound(roomId: string): Promise<boolean> {
    const statusInfo = await this.getRoomStatus(roomId);
    
    // Should advance if:
    // 1. Current gameweek is finished
    // 2. Room is in active status (games were in progress)
    // 3. There are still active players
    if (statusInfo.gameweekFinished && statusInfo.status === 'active') {
      // Check if there are still active players
      const { data: activePlayers, error } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', roomId)
        .eq('status', 'active');

      if (error) {
        console.error('Error checking active players:', error);
        return false;
      }

      return (activePlayers?.length || 0) > 1; // More than 1 player left
    }

    return false;
  }

  /**
   * Advance room to next round
   */
  static async advanceToNextRound(roomId: string): Promise<RoomStatusInfo> {
    // Call the database function to advance
    const { data, error } = await supabase.rpc('advance_to_next_round', {
      p_room_id: roomId
    });

    if (error) {
      console.error('Error advancing to next round:', error);
      throw error;
    }

    // Return updated status
    return await this.getRoomStatus(roomId);
  }

  /**
   * Start round 1 when deadline passes
   */
  static async startRound1(roomId: string): Promise<RoomStatusInfo> {
    // Call the database function to start round 1
    const { data, error } = await supabase.rpc('start_round_1', {
      p_room_id: roomId
    });

    if (error) {
      console.error('Error starting round 1:', error);
      throw error;
    }

    // Return updated status
    return await this.getRoomStatus(roomId);
  }
}

