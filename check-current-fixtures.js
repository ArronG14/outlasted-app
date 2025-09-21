// 🎯 Check Current Fixtures Script for OUTLASTED
// Run with: node check-current-fixtures.js

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentFixtures() {
  try {
    console.log('🚀 Checking current fixtures...');
    
    // Check what gameweeks we have
    const { data: gameweeks, error: gwError } = await supabase
      .from('gameweeks')
      .select('gw, deadline_utc, is_current, is_next, is_finished')
      .order('gw');
    
    if (gwError) throw gwError;
    
    console.log('\n📅 Gameweeks in database:');
    gameweeks.forEach(gw => {
      const status = gw.is_current ? 'CURRENT' : gw.is_next ? 'NEXT' : gw.is_finished ? 'FINISHED' : 'UPCOMING';
      console.log(`   GW${gw.gw}: ${new Date(gw.deadline_utc).toLocaleDateString()} [${status}]`);
    });
    
    // Check current gameweek fixtures
    const currentGW = gameweeks.find(gw => gw.is_current);
    if (currentGW) {
      console.log(`\n⚽ Current Gameweek ${currentGW.gw} fixtures:`);
      
      const { data: fixtures, error: fixturesError } = await supabase
        .from('fixtures')
        .select('fixture_id, home_team_id, away_team_id, home_score, away_score, status, kickoff_utc')
        .eq('gw', currentGW.gw)
        .order('kickoff_utc');
      
      if (fixturesError) throw fixturesError;
      
      // Get team names
      const { data: teams, error: teamsError } = await supabase
        .from('pl_teams')
        .select('team_id, name, short_name');
      
      if (teamsError) throw teamsError;
      const teamMap = new Map(teams?.map(t => [t.team_id, t]) || []);
      
      fixtures.forEach(fixture => {
        const homeTeam = teamMap.get(fixture.home_team_id);
        const awayTeam = teamMap.get(fixture.away_team_id);
        const kickoff = new Date(fixture.kickoff_utc).toLocaleString();
        
        if (homeTeam && awayTeam) {
          const score = fixture.home_score !== null && fixture.away_score !== null 
            ? ` (${fixture.home_score}-${fixture.away_score})` 
            : '';
          console.log(`   ${homeTeam.short_name} vs ${awayTeam.short_name}${score} [${fixture.status}] - ${kickoff}`);
        }
      });
    }
    
    // Check if we need to sync data
    console.log('\n🔄 Checking if data sync is needed...');
    const latestFixture = await supabase
      .from('fixtures')
      .select('kickoff_utc')
      .order('kickoff_utc', { ascending: false })
      .limit(1);
    
    if (latestFixture.data && latestFixture.data.length > 0) {
      const latestDate = new Date(latestFixture.data[0].kickoff_utc);
      const now = new Date();
      console.log(`   Latest fixture in DB: ${latestDate.toLocaleString()}`);
      console.log(`   Current time: ${now.toLocaleString()}`);
      
      if (latestDate < now) {
        console.log('   ⚠️  Database may be outdated - run sync-data.js to update');
      } else {
        console.log('   ✅ Database appears up to date');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkCurrentFixtures();
