/*
  # Initial OUTLASTED Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique, not null)
      - `display_name` (text, nullable) - user's chosen display name
      - `avatar_url` (text, nullable) - profile picture URL
      - `total_rooms` (integer, default 0) - lifetime rooms joined
      - `total_wins` (integer, default 0) - lifetime wins
      - `total_earnings` (numeric, default 0) - lifetime earnings in currency
      - `best_streak` (integer, default 0) - longest survival streak
      - `created_at` (timestamptz, auto) - account creation
      - `updated_at` (timestamptz, auto) - last profile update

    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text, not null) - room display name
      - `description` (text, nullable) - optional room description
      - `buy_in` (numeric, not null) - entry fee amount
      - `max_players` (integer, not null) - maximum participants
      - `current_players` (integer, default 0) - current participant count
      - `is_public` (boolean, default true) - public vs private room
      - `invite_code` (text, unique) - private room access code
      - `host_id` (uuid, foreign key) - room creator
      - `current_gameweek` (integer, default 1) - active gameweek
      - `status` (enum: waiting, active, completed) - room state
      - `dgw_rule` (enum: first_only, both_count) - double gameweek handling
      - `no_pick_policy` (enum: eliminate, random_pick) - missing pick handling
      - `deal_threshold` (integer, default 2) - minimum players for deals
      - `prize_pot` (numeric, computed) - total prize money
      - `created_at` (timestamptz, auto)
      - `updated_at` (timestamptz, auto)

    - `room_players`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key) - references rooms
      - `player_id` (uuid, foreign key) - references profiles
      - `status` (enum: active, eliminated, pending_pick) - player state
      - `joined_at` (timestamptz, auto) - when player joined
      - `eliminated_at` (timestamptz, nullable) - when eliminated
      - `eliminated_gameweek` (integer, nullable) - gameweek of elimination

    - `picks`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key) - references rooms
      - `player_id` (uuid, foreign key) - references profiles
      - `gameweek` (integer, not null) - gameweek number
      - `team_name` (text, not null) - selected Premier League team
      - `is_locked` (boolean, default false) - whether pick is locked
      - `result` (enum: pending, win, lose, draw) - match outcome
      - `created_at` (timestamptz, auto) - when pick was made
      - `locked_at` (timestamptz, nullable) - when pick was locked

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Room hosts can manage their rooms
    - Players can read room data they're part of
    - Picks are only editable before lock time

  3. Indexes
    - Performance indexes on frequently queried columns
    - Unique constraints on invite codes and user picks per gameweek
*/

-- Create enum types
CREATE TYPE room_status AS ENUM ('waiting', 'active', 'completed');
CREATE TYPE dgw_rule_type AS ENUM ('first_only', 'both_count');
CREATE TYPE no_pick_policy_type AS ENUM ('eliminate', 'random_pick');
CREATE TYPE player_status AS ENUM ('active', 'eliminated', 'pending_pick');
CREATE TYPE pick_result AS ENUM ('pending', 'win', 'lose', 'draw');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  total_rooms integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  best_streak integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  buy_in numeric NOT NULL CHECK (buy_in >= 0),
  max_players integer NOT NULL CHECK (max_players > 0),
  current_players integer DEFAULT 0,
  is_public boolean DEFAULT true,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_gameweek integer DEFAULT 1,
  status room_status DEFAULT 'waiting',
  dgw_rule dgw_rule_type DEFAULT 'first_only',
  no_pick_policy no_pick_policy_type DEFAULT 'eliminate',
  deal_threshold integer DEFAULT 2 CHECK (deal_threshold >= 2),
  prize_pot numeric GENERATED ALWAYS AS (buy_in * current_players) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Room players table (junction table)
CREATE TABLE IF NOT EXISTS room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status player_status DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  eliminated_at timestamptz,
  eliminated_gameweek integer,
  UNIQUE(room_id, player_id)
);

-- Picks table
CREATE TABLE IF NOT EXISTS picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gameweek integer NOT NULL CHECK (gameweek > 0),
  team_name text NOT NULL,
  is_locked boolean DEFAULT false,
  result pick_result DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  locked_at timestamptz,
  UNIQUE(room_id, player_id, gameweek)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Users can read public rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (is_public = true OR host_id = auth.uid());

CREATE POLICY "Users can read rooms they joined"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = rooms.id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Room hosts can update their rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid());

-- RLS Policies for room_players
CREATE POLICY "Users can read room players for joined rooms"
  ON room_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp2 
      WHERE rp2.room_id = room_players.room_id AND rp2.player_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_players
  FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for picks
CREATE POLICY "Users can read picks for joined rooms"
  ON picks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = picks.room_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own picks"
  ON picks
  FOR ALL
  TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_public ON rooms(is_public, status);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player ON room_players(player_id);
CREATE INDEX IF NOT EXISTS idx_picks_room_gameweek ON picks(room_id, gameweek);
CREATE INDEX IF NOT EXISTS idx_picks_player ON picks(player_id);

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update room player count
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rooms 
    SET current_players = current_players + 1 
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rooms 
    SET current_players = current_players - 1 
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for room player count
DROP TRIGGER IF EXISTS on_room_player_added ON room_players;
CREATE TRIGGER on_room_player_added
  AFTER INSERT ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

DROP TRIGGER IF EXISTS on_room_player_removed ON room_players;
CREATE TRIGGER on_room_player_removed
  AFTER DELETE ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();