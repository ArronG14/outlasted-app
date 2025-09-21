// 🧪 Simple test to check FPL API data
console.log('🔍 Testing FPL API data...\n');

async function testFPLAPI() {
  try {
    // Fetch FPL data
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const data = await response.json();
    
    console.log(`📊 Total fixtures in FPL API: ${data.length}`);
    
    // Find finished games with scores
    const finishedGames = data.filter(f => f.finished && f.team_h_score !== null && f.team_a_score !== null);
    console.log(`✅ Finished games with scores: ${finishedGames.length}`);
    
    if (finishedGames.length > 0) {
      console.log('\n📋 Sample finished games:');
      finishedGames.slice(0, 3).forEach(game => {
        console.log(`   GW${game.event}: Team ${game.team_h} ${game.team_h_score}-${game.team_a_score} Team ${game.team_a} (Fixture ID: ${game.id})`);
      });
    }
    
    // Check if there are any games for the current gameweek
    const currentGW = Math.max(...data.map(f => f.event));
    const currentGWGames = data.filter(f => f.event === currentGW);
    console.log(`\n📅 Current gameweek (GW${currentGW}): ${currentGWGames.length} games`);
    
    const finishedCurrentGW = currentGWGames.filter(f => f.finished);
    console.log(`✅ Finished games in current GW: ${finishedCurrentGW.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFPLAPI();
