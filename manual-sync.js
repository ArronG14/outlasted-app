// 🚀 Manual sync to fix the score display issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace this!

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  console.log('📝 Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manualSync() {
  console.log('🚀 Manual FPL sync starting...\n');
  
  try {
    // 1. Fetch FPL data
    console.log('📡 Fetching FPL data...');
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const fixtures = await response.json();
    
    console.log(`✅ Fetched ${fixtures.length} fixtures from FPL API`);
    
    // 2. Update fixtures in database
    console.log('📋 Updating fixtures in database...');
    
    const validFixtures = fixtures.filter(f => 
      f.id && f.event && f.kickoff_time && f.team_h && f.team_a
    );
    
    const { error: fixturesError } = await supabase
      .from('fixtures')
      .upsert(
        validFixtures.map(fixture => ({
          fixture_id: fixture.id,
          gw: fixture.event,
          kickoff_utc: fixture.kickoff_time,
          home_team_id: fixture.team_h,
          away_team_id: fixture.team_a
        })),
        { onConflict: 'fixture_id' }
      );
    
    if (fixturesError) throw fixturesError;
    console.log(`✅ Updated ${validFixtures.length} fixtures in database`);
    
    // 3. Check finished games
    const finishedGames = fixtures.filter(f => f.finished && f.team_h_score !== null && f.team_a_score !== null);
    console.log(`✅ Found ${finishedGames.length} finished games with scores`);
    
    if (finishedGames.length > 0) {
      console.log('\n📊 Sample finished games:');
      finishedGames.slice(0, 3).forEach(game => {
        console.log(`   GW${game.event}: Team ${game.team_h} ${game.team_h_score}-${game.team_a_score} Team ${game.team_a}`);
      });
    }
    
    console.log('\n🎉 Manual sync completed!');
    console.log('💡 Your fixtures page should now show scores!');
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error.message);
  }
}

manualSync();
