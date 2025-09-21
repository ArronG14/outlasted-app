// 🎯 Debug Time Status Script for OUTLASTED
// Run with: node debug-time-status.js

async function debugTimeStatus() {
  try {
    console.log('🚀 Debugging time status...');
    
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'OUTLASTED-App/1.0' }
    });
    
    const fixtures = await response.json();
    
    // Find today's fixtures
    const todayFixtures = fixtures.filter(f => {
      const kickoff = new Date(f.kickoff_time);
      return kickoff.toDateString() === 'Sun Sep 21 2025';
    });
    
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Current time: ${now.toLocaleString()}`);
    
    console.log('\n📅 Today\'s fixtures analysis:');
    
    todayFixtures.forEach(f => {
      const kickoff = new Date(f.kickoff_time);
      const timeDiff = now - kickoff;
      const hoursSinceKickoff = timeDiff / (1000 * 60 * 60);
      const minutesSinceKickoff = timeDiff / (1000 * 60);
      
      console.log(`\n   ${f.team_h_name} vs ${f.team_a_name}:`);
      console.log(`      Kickoff: ${kickoff.toISOString()}`);
      console.log(`      Kickoff: ${kickoff.toLocaleString()}`);
      console.log(`      Time since kickoff: ${hoursSinceKickoff.toFixed(2)} hours (${minutesSinceKickoff.toFixed(0)} minutes)`);
      console.log(`      FPL API - Finished: ${f.finished}, Started: ${f.started}`);
      
      // Our logic
      let status = 'scheduled';
      if (f.finished) {
        status = 'finished';
      } else if (f.started) {
        status = 'live';
      } else {
        if (hoursSinceKickoff > 3) {
          status = 'finished';
        } else if (hoursSinceKickoff > 0) {
          status = 'live';
        }
      }
      
      console.log(`      Our status: ${status}`);
      console.log(`      Should be finished? ${hoursSinceKickoff > 3 ? 'YES' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the debug
debugTimeStatus();
