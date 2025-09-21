// 🔍 Check what's actually in your database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  console.log('📝 Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking your database contents...\n');
  
  try {
    // 1. Check teams
    console.log('🏟️  Checking teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('pl_teams')
      .select('team_id, name, short_name')
      .limit(5);
    
    if (teamsError) {
      console.error('❌ Teams error:', teamsError.message);
    } else {
      console.log(`✅ Found ${teams.length} teams in database`);
      if (teams.length > 0) {
        console.log('📋 Sample teams:');
        teams.forEach(team => {
          console.log(`   ${team.team_id}: ${team.name} (${team.short_name})`);
        });
      }
    }
    
    // 2. Check gameweeks
    console.log('\n📅 Checking gameweeks...');
    const { data: gameweeks, error: gameweeksError } = await supabase
      .from('gameweeks')
      .select('gw, deadline_utc, is_finished')
      .order('gw')
      .limit(5);
    
    if (gameweeksError) {
      console.error('❌ Gameweeks error:', gameweeksError.message);
    } else {
      console.log(`✅ Found ${gameweeks.length} gameweeks in database`);
      if (gameweeks.length > 0) {
        console.log('📋 Sample gameweeks:');
        gameweeks.forEach(gw => {
          console.log(`   GW${gw.gw}: ${new Date(gw.deadline_utc).toLocaleDateString()} (Finished: ${gw.is_finished})`);
        });
      }
    }
    
    // 3. Check fixtures
    console.log('\n⚽ Checking fixtures...');
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('fixture_id, gw, home_team_id, away_team_id, home_score, away_score, status')
      .order('fixture_id')
      .limit(10);
    
    if (fixturesError) {
      console.error('❌ Fixtures error:', fixturesError.message);
    } else {
      console.log(`✅ Found ${fixtures.length} fixtures in database`);
      if (fixtures.length > 0) {
        console.log('📋 Sample fixtures:');
        fixtures.slice(0, 10).forEach(fixture => {
          const score = fixture.home_score !== null && fixture.away_score !== null 
            ? ` (${fixture.home_score}-${fixture.away_score})` 
            : '';
          const status = fixture.status ? ` [${fixture.status}]` : '';
          console.log(`   ID ${fixture.fixture_id}: GW${fixture.gw} - Team ${fixture.home_team_id} vs Team ${fixture.away_team_id}${score}${status}`);
        });
      }
    }
    
    // 4. Check total counts
    console.log('\n📊 Total counts...');
    
    const { count: totalTeams } = await supabase
      .from('pl_teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalGameweeks } = await supabase
      .from('gameweeks')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalFixtures } = await supabase
      .from('fixtures')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Total teams: ${totalTeams}`);
    console.log(`📈 Total gameweeks: ${totalGameweeks}`);
    console.log(`📈 Total fixtures: ${totalFixtures}`);
    
    // 5. Check if we have the right data
    console.log('\n🎯 Analysis...');
    
    if (totalTeams < 20) {
      console.log('⚠️  Warning: Expected ~20 teams, but found', totalTeams);
    }
    
    if (totalGameweeks < 38) {
      console.log('⚠️  Warning: Expected ~38 gameweeks, but found', totalGameweeks);
    }
    
    if (totalFixtures < 380) {
      console.log('⚠️  Warning: Expected ~380 fixtures, but found', totalFixtures);
    }
    
    if (totalTeams >= 20 && totalGameweeks >= 38 && totalFixtures >= 380) {
      console.log('✅ Database looks good! The issue might be in the frontend display logic.');
    } else {
      console.log('❌ Database is missing data. The GitHub Actions sync is not working properly.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();
