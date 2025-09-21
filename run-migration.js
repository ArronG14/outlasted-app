// 🎯 Run Migration Script for OUTLASTED
// Run with: node run-migration.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 🔑 Your Supabase credentials
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RzbXhweXBhZW95emx0bXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1MDk0MiwiZXhwIjoyMDcyMTI2OTQyfQ.-Xb6_7uzNB5tc2eeyBB70ktfOVt2FWbxMyfLqjtOK5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running migration: Add fixture scores...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20250102000004_add_fixture_scores.sql', 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('💡 Fixtures table now has home_score, away_score, and status columns');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Run the migration
runMigration();
