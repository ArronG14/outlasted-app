// 🎯 Test Elimination Logic Script for OUTLASTED
// Run with: node test-elimination-logic.js

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEliminationLogic() {
  try {
    console.log('🚀 Testing elimination logic with real scores...');
    
    // Test Gameweek 1 (should have finished games)
    const gameweek = 1;
    console.log(`\n📊 Testing Gameweek ${gameweek}...`);
    
    // 1. Get fixtures for this gameweek
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('home_team_id, away_team_id, home_score, away_score, status')
      .eq('gw', gameweek);
    
    if (fixturesError) throw fixturesError;
    
    console.log(`✅ Found ${fixtures.length} fixtures for GW${gameweek}`);
    
    // 2. Get team names
    const { data: teams, error: teamsError } = await supabase
      .from('pl_teams')
      .select('team_id, name');
    
    if (teamsError) throw teamsError;
    
    const teamMap = new Map(teams?.map(t => [t.team_id, t.name]) || []);
    console.log(`✅ Found ${teams.length} teams`);
    
    // 3. Process results
    const teamResults = new Map();
    let finishedGames = 0;
    
    for (const fixture of fixtures || []) {
      if (fixture.status === 'finished' && fixture.home_score !== null && fixture.away_score !== null) {
        const homeTeamName = teamMap.get(fixture.home_team_id);
        const awayTeamName = teamMap.get(fixture.away_team_id);
        
        if (homeTeamName && awayTeamName) {
          // Home team result
          const homeResult = fixture.home_score > fixture.away_score ? 'win' : 
                            fixture.home_score < fixture.away_score ? 'lose' : 'draw';
          teamResults.set(homeTeamName, homeResult);
          
          // Away team result
          const awayResult = fixture.away_score > fixture.home_score ? 'win' : 
                            fixture.away_score < fixture.home_score ? 'lose' : 'draw';
          teamResults.set(awayTeamName, awayResult);
          
          finishedGames++;
          console.log(`   ${homeTeamName} ${fixture.home_score}-${fixture.away_score} ${awayTeamName} (${homeTeamName}: ${homeResult}, ${awayTeamName}: ${awayResult})`);
        }
      }
    }
    
    console.log(`\n🏁 Finished games: ${finishedGames}/${fixtures.length}`);
    console.log(`📈 Team results processed: ${teamResults.size}`);
    
    // 4. Show some example results
    console.log('\n📋 Sample team results:');
    let count = 0;
    for (const [teamName, result] of teamResults) {
      if (count < 10) {
        console.log(`   ${teamName}: ${result}`);
        count++;
      }
    }
    
    // 5. Test elimination scenarios
    console.log('\n🎯 Testing elimination scenarios:');
    const losingTeams = Array.from(teamResults.entries()).filter(([team, result]) => result === 'lose');
    const winningTeams = Array.from(teamResults.entries()).filter(([team, result]) => result === 'win');
    const drawingTeams = Array.from(teamResults.entries()).filter(([team, result]) => result === 'draw');
    
    console.log(`   Teams that would be ELIMINATED: ${losingTeams.length}`);
    console.log(`   Teams that would SURVIVE: ${winningTeams.length + drawingTeams.length}`);
    
    if (losingTeams.length > 0) {
      console.log(`   Example eliminated teams: ${losingTeams.slice(0, 3).map(([team]) => team).join(', ')}`);
    }
    
    console.log('\n✅ Elimination logic test completed successfully!');
    console.log('💡 The system will eliminate players who picked losing teams');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEliminationLogic();
