import { createClient } from '@supabase/supabase-js';

// Environment variables (server-side only)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
}

interface FPLGameweek {
  id: number;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

interface FPLFixture {
  id: number;
  event: number;
  kickoff_time: string;
  team_h: number;
  team_a: number;
}

interface FPLBootstrapResponse {
  teams: FPLTeam[];
  events: FPLGameweek[];
}

interface FPLFixturesResponse extends Array<FPLFixture> {}

// Utility function for retries with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'OUTLASTED-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch FPL bootstrap data
async function fetchBootstrapData(): Promise<FPLBootstrapResponse> {
  console.log('Fetching FPL bootstrap data...');
  
  return withRetry(async () => {
    const response = await fetchWithTimeout('https://fantasy.premierleague.com/api/bootstrap-static/');
    const data = await response.json();
    
    if (!data.teams || !data.events) {
      throw new Error('Invalid bootstrap response structure');
    }
    
    return data;
  });
}

// Fetch FPL fixtures for a specific gameweek
async function fetchFixtures(gameweek: number): Promise<FPLFixturesResponse> {
  console.log(`Fetching fixtures for gameweek ${gameweek}...`);
  
  return withRetry(async () => {
    const response = await fetchWithTimeout(
      `https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`
    );
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid fixtures response structure');
    }
    
    return data;
  });
}

// Upsert teams data
async function upsertTeams(teams: FPLTeam[]): Promise<number> {
  console.log(`Upserting ${teams.length} teams...`);
  
  const { error } = await supabase
    .from('pl_teams')
    .upsert(
      teams.map(team => ({
        team_id: team.id,
        name: team.name,
        short_name: team.short_name
      })),
      { onConflict: 'team_id' }
    );
  
  if (error) {
    throw new Error(`Failed to upsert teams: ${error.message}`);
  }
  
  return teams.length;
}

// Upsert gameweeks data
async function upsertGameweeks(gameweeks: FPLGameweek[]): Promise<number> {
  console.log(`Upserting ${gameweeks.length} gameweeks...`);
  
  const { error } = await supabase
    .from('fpl_gameweeks')
    .upsert(
      gameweeks.map(gw => ({
        gw: gw.id,
        deadline_utc: gw.deadline_time,
        is_current: gw.is_current,
        is_next: gw.is_next,
        is_finished: gw.finished
      })),
      { onConflict: 'gw' }
    );
  
  if (error) {
    throw new Error(`Failed to upsert gameweeks: ${error.message}`);
  }
  
  return gameweeks.length;
}

// Upsert fixtures data
async function upsertFixtures(fixtures: FPLFixture[]): Promise<number> {
  if (fixtures.length === 0) return 0;
  
  console.log(`Upserting ${fixtures.length} fixtures...`);
  
  // Filter out fixtures without valid data
  const validFixtures = fixtures.filter(fixture => 
    fixture.id && 
    fixture.event && 
    fixture.kickoff_time && 
    fixture.team_h && 
    fixture.team_a
  );
  
  if (validFixtures.length === 0) {
    console.log('No valid fixtures to upsert');
    return 0;
  }
  
  const { error } = await supabase
    .from('fixtures')
    .upsert(
      validFixtures.map(fixture => ({
        fixture_id: fixture.id,
        gw: fixture.event,
        kickoff_utc: fixture.kickoff_time,
        home_team_id: fixture.team_h,
        away_team_id: fixture.team_a
      })),
      { onConflict: 'fixture_id' }
    );
  
  if (error) {
    throw new Error(`Failed to upsert fixtures: ${error.message}`);
  }
  
  return validFixtures.length;
}

// Get upcoming gameweeks to sync
function getUpcomingGameweeks(gameweeks: FPLGameweek[]): number[] {
  const currentGw = gameweeks.find(gw => gw.is_current)?.id;
  const nextGw = gameweeks.find(gw => gw.is_next)?.id;
  
  if (!currentGw && !nextGw) {
    console.log('No current or next gameweek found, syncing first 8 gameweeks');
    return gameweeks.slice(0, 8).map(gw => gw.id);
  }
  
  const startGw = currentGw || nextGw!;
  const upcomingGws: number[] = [];
  
  // Include current + next 6-8 gameweeks
  for (let i = 0; i < 8 && (startGw + i) <= 38; i++) {
    upcomingGws.push(startGw + i);
  }
  
  console.log(`Syncing gameweeks: ${upcomingGws.join(', ')}`);
  return upcomingGws;
}

// Main sync function
export async function handler(event: any, context: any) {
  const startTime = Date.now();
  console.log('Starting FPL data sync...');
  
  try {
    // Fetch bootstrap data
    const bootstrapData = await fetchBootstrapData();
    
    // Upsert teams and gameweeks
    const teamsCount = await upsertTeams(bootstrapData.teams);
    const gameweeksCount = await upsertGameweeks(bootstrapData.events);
    
    // Determine which gameweeks to sync fixtures for
    const upcomingGameweeks = getUpcomingGameweeks(bootstrapData.events);
    
    // Sync fixtures for upcoming gameweeks
    let totalFixtures = 0;
    for (const gw of upcomingGameweeks) {
      try {
        const fixtures = await fetchFixtures(gw);
        const fixturesCount = await upsertFixtures(fixtures);
        totalFixtures += fixturesCount;
      } catch (error) {
        console.error(`Failed to sync fixtures for GW ${gw}:`, error);
        // Continue with other gameweeks
      }
    }
    
    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      duration: `${duration}ms`,
      teams: teamsCount,
      gameweeks: gameweeksCount,
      fixtures: totalFixtures,
      gameweeks_synced: upcomingGameweeks
    };
    
    console.log('FPL sync completed successfully:', summary);
    
    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorSummary = {
      success: false,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.error('FPL sync failed:', errorSummary);
    
    return {
      statusCode: 500,
      body: JSON.stringify(errorSummary)
    };
  }
}