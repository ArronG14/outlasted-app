// 🎯 Test FPL API Scores Script for OUTLASTED
// Run with: node test-fpl-scores.js

async function testFPLScores() {
  try {
    console.log('🚀 Testing FPL API for scores...');
    
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const fixtures = await response.json();
    console.log(`📊 Found ${fixtures.length} fixtures from FPL API`);
    
    // Check first few fixtures for scores
    console.log('\n📋 Sample fixtures with scores:');
    fixtures.slice(0, 10).forEach(fixture => {
      console.log(`   ID ${fixture.id}: GW${fixture.event} - Team ${fixture.team_h} vs Team ${fixture.team_a}`);
      console.log(`      Home Score: ${fixture.team_h_score} (type: ${typeof fixture.team_h_score})`);
      console.log(`      Away Score: ${fixture.team_a_score} (type: ${typeof fixture.team_a_score})`);
      console.log(`      Finished: ${fixture.finished} (type: ${typeof fixture.finished})`);
      console.log(`      Started: ${fixture.started} (type: ${typeof fixture.started})`);
      console.log('');
    });
    
    // Count finished games
    const finishedGames = fixtures.filter(f => f.finished === true);
    console.log(`🏁 Finished games: ${finishedGames.length}/${fixtures.length}`);
    
    // Count games with scores
    const gamesWithScores = fixtures.filter(f => f.team_h_score !== null && f.team_a_score !== null);
    console.log(`⚽ Games with scores: ${gamesWithScores.length}/${fixtures.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testFPLScores();
