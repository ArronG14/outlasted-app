// Quick debug script to check room status
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugRoomStatus() {
  try {
    // Test database connection with profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(5);

    if (profilesError) {
      console.log('Profiles error:', profilesError);
    } else {
      console.log('Profiles found:', profiles?.length || 0);
      profiles?.forEach(profile => {
        console.log(`- ${profile.display_name} (${profile.id})`);
      });
    }

    // Get all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, status, current_gameweek, current_round')
      .order('created_at', { ascending: false })
      .limit(5);

    if (roomsError) {
      console.log('Rooms error:', roomsError);
    } else {
      console.log('\nRecent rooms:');
      rooms?.forEach(room => {
        console.log(`- ${room.name}: Status=${room.status}, GW=${room.current_gameweek}, Round=${room.current_round}`);
      });
    }

    // Get all picks
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (picksError) {
      console.log('Picks error:', picksError);
    } else {
      console.log('\nAll picks:');
      picks?.forEach(pick => {
        console.log(`- ${pick.profiles?.display_name}: GW${pick.gameweek} ${pick.team_name} (Result: ${pick.result})`);
      });
    }

    // Check if GW5 is finished
    const { data: gw5, error: gw5Error } = await supabase
      .from('gameweeks')
      .select('gw, is_finished, deadline_utc')
      .eq('gw', 5)
      .single();

    if (gw5Error) throw gw5Error;

    console.log(`\nGW5 status: Finished=${gw5?.is_finished}, Deadline=${gw5?.deadline_utc}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

debugRoomStatus();
