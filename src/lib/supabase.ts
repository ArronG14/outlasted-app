import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types will be generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          total_rooms?: number;
          total_wins?: number;
          total_earnings?: number;
          best_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          total_rooms?: number;
          total_wins?: number;
          total_earnings?: number;
          best_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          buy_in: number;
          max_players: number;
          current_players?: number;
          is_public?: boolean;
          invite_code?: string;
          host_id: string;
          current_gameweek?: number;
          status?: 'waiting' | 'active' | 'completed';
          dgw_rule?: 'first_only' | 'both_count';
          no_pick_policy?: 'eliminate' | 'random_pick';
          deal_threshold?: number;
          prize_pot?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          buy_in?: number;
          max_players?: number;
          current_players?: number;
          is_public?: boolean;
          invite_code?: string;
          host_id?: string;
          current_gameweek?: number;
          status?: 'waiting' | 'active' | 'completed';
          dgw_rule?: 'first_only' | 'both_count';
          no_pick_policy?: 'eliminate' | 'random_pick';
          deal_threshold?: number;
          prize_pot?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          status: 'active' | 'eliminated' | 'pending_pick';
          joined_at: string;
          eliminated_at: string | null;
          eliminated_gameweek: number | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          status?: 'active' | 'eliminated' | 'pending_pick';
          joined_at?: string;
          eliminated_at?: string | null;
          eliminated_gameweek?: number | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          status?: 'active' | 'eliminated' | 'pending_pick';
          joined_at?: string;
          eliminated_at?: string | null;
          eliminated_gameweek?: number | null;
        };
      };
      picks: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          gameweek: number;
          team_name: string;
          is_locked: boolean;
          result: 'pending' | 'win' | 'lose' | 'draw';
          created_at: string;
          locked_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          gameweek: number;
          team_name: string;
          is_locked?: boolean;
          result?: 'pending' | 'win' | 'lose' | 'draw';
          created_at?: string;
          locked_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          gameweek?: number;
          team_name?: string;
          is_locked?: boolean;
          result?: 'pending' | 'win' | 'lose' | 'draw';
          created_at?: string;
          locked_at?: string | null;
        };
      };
    };
  };
};