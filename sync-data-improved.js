// 🎯 IMPROVED FPL Data Sync Script for OUTLASTED
// Better error handling and debugging

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

console.log('🚀 OUTLASTED - Improved FPL Data Sync Starting...');
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Service Key: ${supabaseServiceKey ? 'SET' : 'NOT SET'}`);

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  console.log('📝 Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.log('💡 For GitHub Actions: Add it as a repository secret named SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncFPLData() {
  const startTime = Date.now();
  console.log(`⏰ Starting sync at ${new Date().toISOString()}`);
  
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('fixtures')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    console.log('✅ Database connection successful');
    
    // 1. Fetch teams and gameweeks from FPL API
    console.log('📡 Fetching FPL bootstrap data...');
    const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    if (!bootstrapResponse.ok) {
      throw new Error(`FPL API error: ${bootstrapResponse.status} ${bootstrapResponse.statusText}`);
    }
    
    const bootstrap = await bootstrapResponse.json();
    console.log(`✅ Fetched ${bootstrap.teams.length} teams and ${bootstrap.events.length} gameweeks`);
    
    // 2. Update teams
    console.log('🏟️  Updating teams...');
    const { error: teamsError } = await supabase
      .from('pl_teams')
      .upsert(
        bootstrap.teams.map(team => ({
          team_id: team.id,
          name: team.name,
          short_name: team.short_name
        })),
        { onConflict: 'team_id' }
      );
    
    if (teamsError) throw new Error(`Teams update failed: ${teamsError.message}`);
    console.log(`✅ Updated ${bootstrap.teams.length} teams`);
    
    // 3. Update gameweeks
    console.log('📅 Updating gameweeks...');
    const { error: gameweeksError } = await supabase
      .from('gameweeks')
      .upsert(
        bootstrap.events.map(gw => ({
          gw: gw.id,
          deadline_utc: gw.deadline_time,
          is_current: gw.is_current,
          is_next: gw.is_next,
          is_finished: gw.finished
        })),
        { onConflict: 'gw' }
      );
    
    if (gameweeksError) throw new Error(`Gameweeks update failed: ${gameweeksError.message}`);
    console.log(`✅ Updated ${bootstrap.events.length} gameweeks`);
    
    // 4. Fetch and update fixtures
    console.log('⚽ Fetching ALL fixtures from FPL API...');
    const fixturesResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    if (!fixturesResponse.ok) {
      throw new Error(`Fixtures API error: ${fixturesResponse.status} ${fixturesResponse.statusText}`);
    }
    
    const allFixtures = await fixturesResponse.json();
    console.log(`✅ Fetched ${allFixtures.length} fixtures from FPL API`);
    
    // Filter valid fixtures
    const validFixtures = allFixtures.filter(f => 
      f.id && f.event && f.kickoff_time && f.team_h && f.team_a
    );
    
    console.log(`📋 Processing ${validFixtures.length} valid fixtures...`);
    
    // Check for finished games with scores
    const finishedGames = validFixtures.filter(f => 
      f.finished && f.team_h_score !== null && f.team_a_score !== null
    );
    console.log(`🎯 Found ${finishedGames.length} finished games with scores`);
    
    if (finishedGames.length > 0) {
      console.log('📊 Sample finished games:');
      finishedGames.slice(0, 3).forEach(game => {
        console.log(`   GW${game.event}: Team ${game.team_h} ${game.team_h_score}-${game.team_a_score} Team ${game.team_a} (ID: ${game.id})`);
      });
    }
    
    // Update fixtures in database
    console.log('💾 Updating fixtures in database...');
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
    
    if (fixturesError) throw new Error(`Fixtures update failed: ${fixturesError.message}`);
    console.log(`✅ Updated ${validFixtures.length} fixtures in database`);
    
    // Verify the update
    console.log('🔍 Verifying database update...');
    const { data: dbFixtures, error: verifyError } = await supabase
      .from('fixtures')
      .select('fixture_id, gw')
      .limit(5);
    
    if (verifyError) {
      console.warn(`⚠️  Verification failed: ${verifyError.message}`);
    } else {
      console.log(`✅ Database verification successful - found ${dbFixtures.length} fixtures`);
    }
    
    const duration = Date.now() - startTime;
    console.log('');
    console.log('🎉 FPL data sync completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Summary: ${bootstrap.teams.length} teams, ${bootstrap.events.length} gameweeks, ${validFixtures.length} fixtures`);
    console.log(`🎯 Finished games with scores: ${finishedGames.length}`);
    console.log('💡 Your fixtures page should now show live scores!');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('');
    console.error('❌ Sync failed:', error.message);
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error('💡 Check your SERVICE_ROLE_KEY and database connection');
    process.exit(1);
  }
}

// Run the sync
syncFPLData();
