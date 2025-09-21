// 🎯 Check FPL API Status Script for OUTLASTED
// Run with: node check-fpl-api-status.js

async function checkFPLAPIStatus() {
  try {
    console.log('🚀 Checking FPL API status...');
    
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const fixtures = await response.json();
    console.log(`📊 Found ${fixtures.length} fixtures from FPL API`);
    
    // Check the specific matches from your screenshot
    const targetMatches = [
      { home: 'Bournemouth', away: 'Newcastle' },
      { home: 'Sunderland', away: 'Aston Villa' },
      { home: 'Arsenal', away: 'Man City' }
    ];
    
    console.log('\n🔍 Checking specific matches:');
    
    for (const target of targetMatches) {
      const match = fixtures.find(f => 
        f.team_h_name === target.home && f.team_a_name === target.away
      );
      
      if (match) {
        console.log(`\n   ${target.home} vs ${target.away}:`);
        console.log(`      Score: ${match.team_h_score}-${match.team_a_score}`);
        console.log(`      Finished: ${match.finished}`);
        console.log(`      Started: ${match.started}`);
        console.log(`      Kickoff: ${match.kickoff_time}`);
        console.log(`      Event: GW${match.event}`);
      } else {
        console.log(`\n   ❌ ${target.home} vs ${target.away}: NOT FOUND`);
      }
    }
    
    // Check current time vs kickoff times
    console.log('\n⏰ Time Analysis:');
    const now = new Date();
    console.log(`   Current time: ${now.toISOString()}`);
    
    const recentFixtures = fixtures.filter(f => {
      const kickoff = new Date(f.kickoff_time);
      const timeDiff = now - kickoff;
      return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000; // Last 24 hours
    });
    
    console.log(`   Recent fixtures (last 24h): ${recentFixtures.length}`);
    
    recentFixtures.forEach(f => {
      const kickoff = new Date(f.kickoff_time);
      const timeDiff = now - kickoff;
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`   ${f.team_h_name} vs ${f.team_a_name}: ${hoursAgo}h ${minutesAgo}m ago, Finished: ${f.finished}, Started: ${f.started}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkFPLAPIStatus();
