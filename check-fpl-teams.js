// 🎯 Check FPL API Teams Script for OUTLASTED
// Run with: node check-fpl-teams.js

async function checkFPLTeams() {
  try {
    console.log('🚀 Checking FPL API teams...');
    
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const teams = data.teams;
    
    console.log(`📊 Found ${teams.length} teams from FPL API`);
    
    // Find the teams we're looking for
    const targetTeams = ['Bournemouth', 'Newcastle', 'Sunderland', 'Aston Villa', 'Arsenal', 'Man City'];
    
    console.log('\n🔍 Target teams:');
    targetTeams.forEach(targetName => {
      const team = teams.find(t => t.name === targetName);
      if (team) {
        console.log(`   ${targetName}: ID ${team.id}, Short: ${team.short_name}`);
      } else {
        console.log(`   ❌ ${targetName}: NOT FOUND`);
      }
    });
    
    // Now check fixtures with team IDs
    console.log('\n⚽ Checking fixtures with team IDs...');
    const fixturesResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    const fixtures = await fixturesResponse.json();
    
    // Find matches from today (2025-09-21)
    const todayFixtures = fixtures.filter(f => {
      const kickoff = new Date(f.kickoff_time);
      return kickoff.toDateString() === 'Sun Sep 21 2025';
    });
    
    console.log(`\n📅 Today's fixtures (${todayFixtures.length}):`);
    todayFixtures.forEach(f => {
      const homeTeam = teams.find(t => t.id === f.team_h);
      const awayTeam = teams.find(t => t.id === f.team_a);
      const kickoff = new Date(f.kickoff_time);
      
      if (homeTeam && awayTeam) {
        console.log(`   ${homeTeam.name} vs ${awayTeam.name}: ${f.team_h_score}-${f.team_a_score}`);
        console.log(`      Kickoff: ${kickoff.toLocaleString()}`);
        console.log(`      Finished: ${f.finished}, Started: ${f.started}`);
        console.log(`      Event: GW${f.event}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkFPLTeams();
