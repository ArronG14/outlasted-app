// 🔍 Debug script to check why scores aren't showing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please add your Supabase SERVICE ROLE KEY to this script!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugScores() {
  console.log('🔍 Debugging score display issue...\n');
  
  try {
    // 1. Check what's in the FPL API
    console.log('📡 Fetching FPL API data...');
    const fplResponse = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const fplData = await fplResponse.json();
    
    // Filter for finished games with scores
    const finishedGames = fplData.filter(f => f.finished && f.team_h_score !== null && f.team_a_score !== null);
    console.log(`✅ Found ${finishedGames.length} finished games with scores in FPL API`);
    
    if (finishedGames.length > 0) {
      console.log('\n📊 Sample FPL API data:');
      const sample = finishedGames[0];
      console.log(`   Fixture ID: ${sample.id}`);
      console.log(`   Home Team ID: ${sample.team_h}, Score: ${sample.team_h_score}`);
      console.log(`   Away Team ID: ${sample.team_a}, Score: ${sample.team_a_score}`);
      console.log(`   Gameweek: ${sample.event}`);
    }
    
    // 2. Check what's in your database
    console.log('\n🗄️  Checking database...');
    
    // Check teams
    const { data: teams, error: teamsError } = await supabase
      .from('pl_teams')
      .select('team_id, name, short_name');
    
    if (teamsError) throw teamsError;
    console.log(`✅ Found ${teams.length} teams in database`);
    
    // Check fixtures
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('fixture_id, gw, home_team_id, away_team_id')
      .limit(5);
    
    if (fixturesError) throw fixturesError;
    console.log(`✅ Found ${fixtures.length} fixtures in database (showing first 5)`);
    
    if (fixtures.length > 0) {
      console.log('\n📋 Sample database fixtures:');
      fixtures.forEach(f => {
        console.log(`   Fixture ID: ${f.fixture_id}, GW: ${f.gw}, Teams: ${f.home_team_id} vs ${f.away_team_id}`);
      });
    }
    
    // 3. Check if there's a mismatch
    console.log('\n🔍 Checking for mismatches...');
    
    if (finishedGames.length > 0 && fixtures.length > 0) {
      const fplFixtureId = finishedGames[0].id;
      const dbFixture = fixtures.find(f => f.fixture_id === fplFixtureId);
      
      if (dbFixture) {
        console.log(`✅ Fixture ID ${fplFixtureId} exists in both FPL API and database`);
        
        // Check team mapping
        const homeTeam = teams.find(t => t.team_id === finishedGames[0].team_h);
        const awayTeam = teams.find(t => t.team_id === finishedGames[0].team_a);
        
        if (homeTeam && awayTeam) {
          console.log(`✅ Team mapping works: ${homeTeam.name} (ID: ${homeTeam.team_id})`);
          console.log(`✅ Team mapping works: ${awayTeam.name} (ID: ${awayTeam.team_id})`);
        } else {
          console.log(`❌ Team mapping issue: Can't find teams for IDs ${finishedGames[0].team_h} and ${finishedGames[0].team_a}`);
        }
      } else {
        console.log(`❌ Fixture ID ${fplFixtureId} from FPL API not found in database`);
        console.log(`   This means the GitHub Actions sync didn't work properly`);
      }
    }
    
    // 4. Test the LiveScoreService logic
    console.log('\n🧪 Testing LiveScoreService logic...');
    
    if (finishedGames.length > 0) {
      const sampleGame = finishedGames[0];
      const teamMap = new Map(teams?.map(t => [t.team_id, t.name]) || []);
      
      const homeTeamName = teamMap.get(sampleGame.team_h);
      const awayTeamName = teamMap.get(sampleGame.team_a);
      
      if (homeTeamName && awayTeamName) {
        console.log(`✅ LiveScoreService would work: ${homeTeamName} ${sampleGame.team_h_score}-${sampleGame.team_a_score} ${awayTeamName}`);
      } else {
        console.log(`❌ LiveScoreService would fail: Can't map team IDs to names`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugScores();
