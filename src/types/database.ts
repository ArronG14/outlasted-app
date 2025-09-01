export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  total_rooms: number;
  total_wins: number;
  total_earnings: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  buy_in: number;
  max_players: number;
  current_players: number;
  is_public: boolean;
  invite_code: string;
  host_id: string;
  current_gameweek: number;
  status: 'waiting' | 'active' | 'completed';
  dgw_rule: 'first_only' | 'both_count';
  no_pick_policy: 'eliminate' | 'random_pick';
  deal_threshold: number;
  prize_pot: number;
  created_at: string;
  updated_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  status: 'active' | 'eliminated' | 'pending_pick';
  joined_at: string;
  eliminated_at: string | null;
  eliminated_gameweek: number | null;
}

export interface Pick {
  id: string;
  room_id: string;
  player_id: string;
  gameweek: number;
  team_name: string;
  is_locked: boolean;
  result: 'pending' | 'win' | 'lose' | 'draw';
  created_at: string;
  locked_at: string | null;
}

export interface Deal {
  id: string;
  room_id: string;
  proposed_by: string;
  proposal_type: 'split_even' | 'split_weighted' | 'winner_takes_all';
  amount_per_player: number;
  votes_needed: number;
  votes_received: number;
  status: 'pending' | 'accepted' | 'rejected';
  expires_at: string;
  created_at: string;
}

// Premier League teams for validation
export const PREMIER_LEAGUE_TEAMS = [
  'Arsenal',
  'Aston Villa',
  'Brighton & Hove Albion',
  'Burnley',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Liverpool',
  'Luton Town',
  'Manchester City',
  'Manchester United',
  'Newcastle United',
  'Nottingham Forest',
  'Sheffield United',
  'Tottenham Hotspur',
  'West Ham United',
  'Wolverhampton Wanderers',
  'Bournemouth',
  'Brentford'
] as const;

export type PremierLeagueTeam = typeof PREMIER_LEAGUE_TEAMS[number];