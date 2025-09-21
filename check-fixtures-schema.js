// 🔍 Check the fixtures table schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFixturesSchema() {
  console.log('🔍 Checking fixtures table schema...\n');
  
  try {
    // Test the current query that's failing
    console.log('🧪 Testing current query...');
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        fixture_id,
        gw,
        kickoff_utc,
        home_team_id,
        away_team_id,
        home_team:pl_teams!fixtures_home_team_id_fkey(team_id, name, short_name),
        away_team:pl_teams!fixtures_away_team_id_fkey(team_id, name, short_name)
      `)
      .eq('gw', 1)
      .limit(3);
    
    if (error) {
      console.error('❌ Current query failed:', error.message);
    } else {
      console.log('✅ Current query works!');
      console.log('📋 Sample data:', data);
    }
    
    // Test a simpler query
    console.log('\n🧪 Testing simpler query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('fixtures')
      .select('fixture_id, gw, home_team_id, away_team_id')
      .eq('gw', 1)
      .limit(3);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError.message);
    } else {
      console.log('✅ Simple query works!');
      console.log('📋 Sample data:', simpleData);
    }
    
    // Test team query
    console.log('\n🧪 Testing team query...');
    const { data: teamData, error: teamError } = await supabase
      .from('pl_teams')
      .select('team_id, name, short_name')
      .limit(3);
    
    if (teamError) {
      console.error('❌ Team query failed:', teamError.message);
    } else {
      console.log('✅ Team query works!');
      console.log('📋 Sample data:', teamData);
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkFixturesSchema();
