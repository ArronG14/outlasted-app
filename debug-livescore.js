// 🔍 Debug the LiveScoreService to see why scores aren't showing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLiveScore() {
  console.log('🔍 Debugging LiveScoreService...\n');
  
  try {
    // 1. Test fetchLiveScores (simulate the service)
    console.log('📡 Testing fetchLiveScores...');
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const fplData = await response.json();
    
    // Transform like LiveScoreService does
    const liveScores = fplData.map((fixture) => ({
      fixture_id: fixture.id,
      home_team_id: fixture.team_h,
      away_team_id: fixture.team_a,
      home_score: fixture.team_h_score,
      away_score: fixture.team_a_score,
      status: fixture.finished ? 'finished' : (fixture.started ? 'live' : 'scheduled'),
      kickoff_utc: fixture.kickoff_time,
      gameweek: fixture.event
    }));
    
    console.log(`✅ Fetched ${liveScores.length} live scores`);
    
    // 2. Test team mapping
    console.log('\n🏟️  Testing team mapping...');
    const { data: teams } = await supabase
      .from('pl_teams')
      .select('team_id, name');
    
    const teamMap = new Map(teams?.map(t => [t.team_id, t.name]) || []);
    console.log(`✅ Created team map with ${teamMap.size} teams`);
    
    // Show some team mappings
    console.log('📋 Sample team mappings:');
    for (let i = 1; i <= 5; i++) {
      const teamName = teamMap.get(i);
      console.log(`   Team ID ${i}: ${teamName || 'NOT FOUND'}`);
    }
    
    // 3. Test getGameweekResults for GW1
    console.log('\n🎯 Testing getGameweekResults for GW1...');
    const gameweekFixtures = liveScores.filter(score => score.gameweek === 1);
    console.log(`✅ Found ${gameweekFixtures.length} fixtures for GW1`);
    
    const results = [];
    for (const fixture of gameweekFixtures) {
      if (fixture.status === 'finished' && fixture.home_score !== null && fixture.away_score !== null) {
        const homeTeamName = teamMap.get(fixture.home_team_id);
        const awayTeamName = teamMap.get(fixture.away_team_id);
        
        if (homeTeamName && awayTeamName) {
          results.push({
            fixture_id: fixture.fixture_id,
            home_team: homeTeamName,
            away_team: awayTeamName,
            score: `${fixture.home_score}-${fixture.away_score}`
          });
        } else {
          console.log(`❌ Missing team names for fixture ${fixture.fixture_id}: Team ${fixture.home_team_id} vs Team ${fixture.away_team_id}`);
        }
      }
    }
    
    console.log(`✅ Found ${results.length} finished games with scores for GW1`);
    if (results.length > 0) {
      console.log('📊 Sample results:');
      results.slice(0, 3).forEach(result => {
        console.log(`   ${result.home_team} ${result.score} ${result.away_team} (Fixture ID: ${result.fixture_id})`);
      });
    }
    
    // 4. Test ViewFixtures component logic
    console.log('\n🎨 Testing ViewFixtures display logic...');
    
    // Get fixtures from database (like ViewFixtures does)
    const { data: dbFixtures } = await supabase
      .from('fixtures')
      .select(`
        fixture_id,
        gw,
        kickoff_utc,
        home_team_id,
        away_team_id,
        pl_teams!fixtures_home_team_id_fkey(name, short_name),
        pl_teams!fixtures_away_team_id_fkey(name, short_name)
      `)
      .eq('gw', 1)
      .limit(3);
    
    console.log(`✅ Found ${dbFixtures.length} database fixtures for GW1`);
    
    if (dbFixtures.length > 0) {
      console.log('📋 Database fixtures:');
      dbFixtures.forEach(fixture => {
        console.log(`   ID ${fixture.fixture_id}: ${fixture.pl_teams?.name || 'Unknown'} vs ${fixture.pl_teams?.name || 'Unknown'}`);
      });
    }
    
    // 5. Test the getLiveFixture function
    console.log('\n🔍 Testing getLiveFixture function...');
    
    if (dbFixtures.length > 0) {
      const testFixtureId = dbFixtures[0].fixture_id;
      const liveFixture = liveScores.find(score => score.fixture_id === testFixtureId);
      
      if (liveFixture) {
        console.log(`✅ Found live data for fixture ${testFixtureId}:`);
        console.log(`   Score: ${liveFixture.home_score}-${liveFixture.away_score}`);
        console.log(`   Status: ${liveFixture.status}`);
      } else {
        console.log(`❌ No live data found for fixture ${testFixtureId}`);
        console.log(`   Available fixture IDs in live data: ${liveScores.slice(0, 5).map(s => s.fixture_id).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLiveScore();
