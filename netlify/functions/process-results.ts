import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event, context) => {
  try {
    console.log('Processing gameweek results...');
    
    // Get all active rooms
    const { data: activeRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, current_gameweek, status')
      .eq('status', 'active');
    
    if (roomsError) throw roomsError;
    
    if (!activeRooms || activeRooms.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active rooms to process' })
      };
    }
    
    const results = [];
    
    for (const room of activeRooms) {
      try {
        console.log(`Processing room ${room.id} for gameweek ${room.current_gameweek}`);
        
        // Check if gameweek is finished
        const isFinished = await checkGameweekFinished(room.current_gameweek);
        
        if (isFinished) {
          // Process results for this room
          const eliminationResult = await processRoomResults(room.id, room.current_gameweek);
          
          // Check if all players were eliminated in this round
          if (eliminationResult.remaining_active === 0) {
            // All players eliminated - reactivate them and advance to next gameweek
            await reactivatePlayersAndAdvance(room.id, room.current_gameweek);
            results.push({
              room_id: room.id,
              gameweek: room.current_gameweek,
              eliminated: eliminationResult.eliminated_count,
              remaining: eliminationResult.remaining_active,
              action: 'players_reactivated_and_advanced'
            });
          } else if (eliminationResult.remaining_active > 1) {
            await advanceToNextGameweek(room.id);
            results.push({
              room_id: room.id,
              gameweek: room.current_gameweek,
              eliminated: eliminationResult.eliminated_count,
              remaining: eliminationResult.remaining_active,
              action: 'advanced_to_next_round'
            });
          } else {
            // Game complete - mark as completed
            await supabase
              .from('rooms')
              .update({ status: 'completed' })
              .eq('id', room.id);
            results.push({
              room_id: room.id,
              gameweek: room.current_gameweek,
              eliminated: eliminationResult.eliminated_count,
              remaining: eliminationResult.remaining_active,
              action: 'game_completed'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing room ${room.id}:`, error);
        results.push({
          room_id: room.id,
          error: error.message
        });
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Gameweek results processed',
        results
      })
    };
  } catch (error) {
    console.error('Error processing results:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function checkGameweekFinished(gameweek: number): Promise<boolean> {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const data = await response.json();
    
    const gameweekFixtures = data.filter((fixture: any) => fixture.event === gameweek);
    
    if (gameweekFixtures.length === 0) return false;
    
    return gameweekFixtures.every((fixture: any) => fixture.finished);
  } catch (error) {
    console.error('Error checking gameweek status:', error);
    return false;
  }
}

async function processRoomResults(roomId: string, gameweek: number) {
  try {
    // Get team results from FPL API
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const data = await response.json();
    
    const gameweekFixtures = data.filter((fixture: any) => fixture.event === gameweek);
    const teamResults = new Map();
    
    // Process fixture results
    for (const fixture of gameweekFixtures) {
      if (fixture.finished && fixture.team_h_score !== null && fixture.team_a_score !== null) {
        // Home team result
        const homeResult = fixture.team_h_score > fixture.team_a_score ? 'win' : 
                          fixture.team_h_score < fixture.team_a_score ? 'lose' : 'draw';
        teamResults.set(fixture.team_h, homeResult);
        
        // Away team result
        const awayResult = fixture.team_a_score > fixture.team_h_score ? 'win' : 
                          fixture.team_a_score < fixture.team_h_score ? 'lose' : 'draw';
        teamResults.set(fixture.team_a, awayResult);
      }
    }
    
    // Get all picks for this room and gameweek
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .eq('room_id', roomId)
      .eq('gameweek', gameweek);
    
    if (picksError) throw picksError;
    
    let eliminatedCount = 0;
    
    // Process each pick
    for (const pick of picks || []) {
      const teamResult = teamResults.get(pick.team_name);
      
      if (teamResult) {
        // Update pick with result
        await supabase
          .from('picks')
          .update({ 
            result: teamResult,
            is_locked: true
          })
          .eq('id', pick.id);
        
        // If team lost, eliminate player
        if (teamResult === 'lose') {
          await supabase
            .from('room_players')
            .update({
              status: 'eliminated',
              eliminated_at: new Date().toISOString(),
              eliminated_gameweek: gameweek
            })
            .eq('room_id', roomId)
            .eq('player_id', pick.player_id)
            .eq('status', 'active');
          
          eliminatedCount++;
        }
      }
    }
    
    // Get remaining active players
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
      remaining_active: remainingActive
    };
  } catch (error) {
    console.error('Error processing room results:', error);
    throw error;
  }
}

async function advanceToNextGameweek(roomId: string) {
  try {
    // Get current room data
    const { data: room } = await supabase
      .from('rooms')
      .select('current_gameweek, current_round')
      .eq('id', roomId)
      .single();
    
    if (!room) return;
    
    // Find next available gameweek
    const { data: nextGameweek } = await supabase
      .from('gameweeks')
      .select('gw')
      .gt('gw', room.current_gameweek)
      .eq('is_finished', false)
      .order('gw', { ascending: true })
      .limit(1);
    
    if (nextGameweek && nextGameweek.length > 0) {
      // Advance to next round and gameweek
      await supabase
        .from('rooms')
        .update({ 
          current_round: room.current_round + 1,
          current_gameweek: nextGameweek[0].gw,
          status: 'active'
        })
        .eq('id', roomId);
    } else {
      // No more gameweeks - game is complete
      await supabase
        .from('rooms')
        .update({ status: 'completed' })
        .eq('id', roomId);
    }
  } catch (error) {
    console.error('Error advancing gameweek:', error);
    throw error;
  }
}

async function reactivatePlayersAndAdvance(roomId: string, gameweek: number) {
  try {
    console.log(`Reactivating all players for room ${roomId}, gameweek ${gameweek}`);
    
    // Get all players who were eliminated in this gameweek
    const { data: eliminatedPlayers, error: eliminatedError } = await supabase
      .from('room_players')
      .select('player_id')
      .eq('room_id', roomId)
      .eq('eliminated_gameweek', gameweek)
      .eq('status', 'eliminated');
    
    if (eliminatedError) throw eliminatedError;
    
    if (!eliminatedPlayers || eliminatedPlayers.length === 0) {
      console.log('No eliminated players found for reactivation');
      return;
    }
    
    // Reactivate all players who were eliminated in this gameweek
    const playerIds = eliminatedPlayers.map(p => p.player_id);
    const { error: reactivateError } = await supabase
      .from('room_players')
      .update({
        status: 'active',
        eliminated_at: null,
        eliminated_gameweek: null
      })
      .eq('room_id', roomId)
      .in('player_id', playerIds);
    
    if (reactivateError) throw reactivateError;
    
    // Update room player count
    const { data: allPlayers } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'active');
    
    // Advance to next gameweek (same logic as normal advancement)
    const { data: room } = await supabase
      .from('rooms')
      .select('current_gameweek, current_round')
      .eq('id', roomId)
      .single();
    
    if (!room) return;
    
    // Find next available gameweek
    const { data: nextGameweek } = await supabase
      .from('gameweeks')
      .select('gw')
      .gt('gw', room.current_gameweek)
      .eq('is_finished', false)
      .order('gw', { ascending: true })
      .limit(1);
    
    if (nextGameweek && nextGameweek.length > 0) {
      // Advance to next round and gameweek
      await supabase
        .from('rooms')
        .update({ 
          current_round: room.current_round + 1,
          current_gameweek: nextGameweek[0].gw,
          current_players: allPlayers?.length || 0,
          status: 'active'
        })
        .eq('id', roomId);
    } else {
      // No more gameweeks - game is complete
      await supabase
        .from('rooms')
        .update({ 
          status: 'completed',
          current_players: allPlayers?.length || 0
        })
        .eq('id', roomId);
    }
    
    console.log(`Players reactivated and advanced: ${eliminatedPlayers.length} players reactivated`);
  } catch (error) {
    console.error('Error reactivating players and advancing:', error);
    throw error;
  }
}
