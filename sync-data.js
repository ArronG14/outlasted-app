// 🎯 FREE FPL Data Sync Script for OUTLASTED
// Run with: node sync-data.js

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
// 👆 You'll need to get your SERVICE ROLE KEY from Supabase Dashboard → Settings → API

console.log('🚀 OUTLASTED - Free FPL Data Sync Starting...');
console.log('💡 Make sure to add your SERVICE_ROLE_KEY below!');

// Get service role key from environment variable (for GitHub Actions) or use placeholder
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  console.log('📝 Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.log('💡 For GitHub Actions: Add it as a repository secret named SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncFPLData() {
  try {
    console.log('📡 Fetching FPL data...');
    
    // 1. Fetch teams and gameweeks from FPL API
    const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    const bootstrap = await bootstrapResponse.json();
    
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
    
    if (teamsError) throw teamsError;
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
    
    if (gameweeksError) throw gameweeksError;
    console.log(`✅ Updated ${bootstrap.events.length} gameweeks`);
    
    // 4. Fetch and update fixtures for all gameweeks
    console.log('⚽ Fetching ALL fixtures...');
    const fixturesResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    const allFixtures = await fixturesResponse.json();
    
    const validFixtures = allFixtures.filter(f => 
      f.id && f.event && f.kickoff_time && f.team_h && f.team_a
    );
    
    console.log(`📋 Updating ${validFixtures.length} fixtures...`);
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
    console.log(`✅ Updated ${validFixtures.length} fixtures`);
    
    console.log('');
    console.log('🎉 FPL data sync completed successfully!');
    console.log('💡 Your fixtures page should now show live scores!');
    console.log('🔄 Run this script anytime to update data for free!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.log('💡 Make sure your SERVICE_ROLE_KEY is correct');
  }
}

// Run the sync
syncFPLData();
