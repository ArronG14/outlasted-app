// 🎯 AUTO-RUN FPL Data Sync Script for OUTLASTED
// This version runs automatically every 2 hours

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncFPLData() {
  const startTime = new Date();
  console.log(`🔄 [${startTime.toLocaleTimeString()}] Starting FPL data sync...`);
  
  try {
    // Fetch teams and gameweeks from FPL API
    const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    const bootstrap = await bootstrapResponse.json();
    
    // Update teams
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
    
    if (teamsError) throw teamsError;
    
    // Update gameweeks
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
    
    if (gameweeksError) throw gameweeksError;
    
    // Fetch and update fixtures
    const fixturesResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    const allFixtures = await fixturesResponse.json();
    
    const validFixtures = allFixtures.filter(f => 
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
    
    const duration = Date.now() - startTime.getTime();
    console.log(`✅ [${new Date().toLocaleTimeString()}] Sync completed in ${duration}ms`);
    console.log(`📊 Updated: ${bootstrap.teams.length} teams, ${bootstrap.events.length} gameweeks, ${validFixtures.length} fixtures`);
    
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Sync failed:`, error.message);
  }
}

// Run immediately
await syncFPLData();

// Then run every 2 hours (7200000 ms)
console.log('🔄 Auto-sync enabled - running every 2 hours...');
console.log('💡 Press Ctrl+C to stop');

setInterval(syncFPLData, 7200000); // 2 hours
