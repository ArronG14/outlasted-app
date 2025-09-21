// 🎯 OUTLASTED Sync Setup Script
// This helps you set up the auto-sync with your Supabase key

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🚀 OUTLASTED - FPL Sync Setup');
console.log('');

// Get Supabase credentials from user
const supabaseUrl = 'https://crwdsmxpypaeoyzltmvc.supabase.co';
console.log('📝 Please get your SERVICE ROLE KEY from:');
console.log('   Supabase Dashboard → Settings → API → service_role key');
console.log('');

// Read the sync files and replace the placeholder
const syncFiles = ['sync-data.js', 'sync-auto.js'];

console.log('🔧 Setting up sync scripts...');

for (const file of syncFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('YOUR_SERVICE_ROLE_KEY_HERE')) {
      console.log(`⚠️  Please edit ${file} and replace 'YOUR_SERVICE_ROLE_KEY_HERE' with your actual key`);
    } else {
      console.log(`✅ ${file} is ready to use`);
    }
  }
}

console.log('');
console.log('🎯 How to use:');
console.log('   1. Edit sync-data.js and sync-auto.js');
console.log('   2. Replace YOUR_SERVICE_ROLE_KEY_HERE with your actual key');
console.log('   3. Run: npm run sync (one-time)');
console.log('   4. Run: npm run sync-auto (auto-runs every 2 hours)');
console.log('');
console.log('💡 The auto-sync will keep your data fresh without any costs!');
