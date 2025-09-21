// 🎯 Add Fixture Score Columns Script for OUTLASTED
// Run with: node add-fixture-columns.js

import { createClient } from '@supabase/supabase-js';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addFixtureColumns() {
  try {
    console.log('🚀 Adding fixture score columns...');
    
    // Add home_score column
    console.log('📊 Adding home_score column...');
    const { error: homeScoreError } = await supabase
      .from('fixtures')
      .select('fixture_id')
      .limit(1);
    
    if (homeScoreError && homeScoreError.message.includes('column "home_score" does not exist')) {
      console.log('✅ home_score column needs to be added');
    } else {
      console.log('ℹ️  home_score column may already exist');
    }
    
    // Add away_score column
    console.log('📊 Adding away_score column...');
    const { error: awayScoreError } = await supabase
      .from('fixtures')
      .select('fixture_id')
      .limit(1);
    
    if (awayScoreError && awayScoreError.message.includes('column "away_score" does not exist')) {
      console.log('✅ away_score column needs to be added');
    } else {
      console.log('ℹ️  away_score column may already exist');
    }
    
    // Add status column
    console.log('📊 Adding status column...');
    const { error: statusError } = await supabase
      .from('fixtures')
      .select('fixture_id')
      .limit(1);
    
    if (statusError && statusError.message.includes('column "status" does not exist')) {
      console.log('✅ status column needs to be added');
    } else {
      console.log('ℹ️  status column may already exist');
    }
    
    console.log('');
    console.log('💡 You need to run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Add score columns to fixtures table');
    console.log('ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS home_score integer;');
    console.log('ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS away_score integer;');
    console.log('ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS status text DEFAULT \'scheduled\';');
    console.log('');
    console.log('-- Add check constraint for status values');
    console.log('ALTER TABLE fixtures ADD CONSTRAINT IF NOT EXISTS fixtures_status_check CHECK (status IN (\'scheduled\', \'live\', \'finished\'));');
    console.log('');
    console.log('-- Add indexes for performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);');
    console.log('CREATE INDEX IF NOT EXISTS idx_fixtures_scores ON fixtures(home_score, away_score) WHERE home_score IS NOT NULL AND away_score IS NOT NULL;');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
addFixtureColumns();
