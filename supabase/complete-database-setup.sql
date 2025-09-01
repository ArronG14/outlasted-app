-- OUTLASTED Complete Database Setup
-- Run this in your Supabase SQL editor after running the cleanup script

-- ============================================================================
-- 1. CREATE ENUM TYPES
-- ============================================================================

CREATE TYPE room_status AS ENUM ('waiting', 'active', 'completed');
CREATE TYPE dgw_rule_type AS ENUM ('first_only', 'both_count');
CREATE TYPE no_pick_policy_type AS ENUM ('eliminate', 'random_pick');
CREATE TYPE player_status AS ENUM ('active', 'eliminated', 'pending_pick');
CREATE TYPE pick_result AS ENUM ('pending', 'win', 'lose', 'draw');

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
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
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  buy_in numeric NOT NULL CHECK (buy_in >= 0),
  max_players integer NOT NULL CHECK (max_players > 0),
  current_players integer DEFAULT 0,
  is_public boolean DEFAULT true,
  invite_code text UNIQUE DEFAULT upper(encode(gen_random_bytes(4), 'hex')),
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
CREATE TABLE room_players (
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
CREATE TABLE picks (
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

-- Premier League teams table
CREATE TABLE pl_teams (
  team_id integer PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL
);

-- Gameweeks table
CREATE TABLE gameweeks (
  gw integer PRIMARY KEY,
  deadline_utc timestamptz NOT NULL,
  is_current boolean DEFAULT false,
  is_next boolean DEFAULT false,
  is_finished boolean DEFAULT false
);

-- Fixtures table
CREATE TABLE fixtures (
  fixture_id integer PRIMARY KEY,
  gw integer NOT NULL REFERENCES gameweeks(gw) ON DELETE CASCADE,
  kickoff_utc timestamptz NOT NULL,
  home_team_id integer NOT NULL REFERENCES pl_teams(team_id) ON DELETE CASCADE,
  away_team_id integer NOT NULL REFERENCES pl_teams(team_id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Users can read public rooms"
  ON rooms FOR SELECT TO authenticated
  USING (is_public = true OR host_id = auth.uid());

CREATE POLICY "Users can read rooms they joined"
  ON rooms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = rooms.id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Room hosts can update their rooms"
  ON rooms FOR UPDATE TO authenticated
  USING (host_id = auth.uid());

-- Room players policies
CREATE POLICY "Users can read room players for joined rooms"
  ON room_players FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp2 
      WHERE rp2.room_id = room_players.room_id AND rp2.player_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_players FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Picks policies
CREATE POLICY "Users can read picks for joined rooms"
  ON picks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = picks.room_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own picks"
  ON picks FOR ALL TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- FPL data policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can read teams"
  ON pl_teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read gameweeks"
  ON gameweeks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read fixtures"
  ON fixtures FOR SELECT TO authenticated USING (true);

-- Deny all writes to FPL data from clients (service role only)
CREATE POLICY "Deny client writes to teams"
  ON pl_teams FOR ALL TO authenticated USING (false);

CREATE POLICY "Deny client writes to gameweeks"
  ON gameweeks FOR ALL TO authenticated USING (false);

CREATE POLICY "Deny client writes to fixtures"
  ON fixtures FOR ALL TO authenticated USING (false);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_rooms_public ON rooms(is_public, status);
CREATE INDEX idx_rooms_host ON rooms(host_id);
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_player ON room_players(player_id);
CREATE INDEX idx_picks_room_gameweek ON picks(room_id, gameweek);
CREATE INDEX idx_picks_player ON picks(player_id);
CREATE INDEX idx_fixtures_gw_kickoff ON fixtures(gw, kickoff_utc);
CREATE INDEX idx_fixtures_home_team ON fixtures(home_team_id);
CREATE INDEX idx_fixtures_away_team ON fixtures(away_team_id);
CREATE INDEX idx_gameweeks_current ON gameweeks(is_current) WHERE is_current = true;
CREATE INDEX idx_gameweeks_next ON gameweeks(is_next) WHERE is_next = true;

-- ============================================================================
-- 6. CREATE FUNCTIONS
-- ============================================================================

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

-- Create room function (FIXED: now properly handles buy_in as numeric)
CREATE OR REPLACE FUNCTION create_room(
  p_name text,
  p_buy_in numeric,
  p_player_limit integer,
  p_is_public boolean DEFAULT true,
  p_code text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_room_code text;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Generate room code if not provided
  IF p_code IS NULL OR p_code = '' THEN
    v_room_code := upper(encode(gen_random_bytes(4), 'hex'));
  ELSE
    v_room_code := upper(p_code);
  END IF;

  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM rooms WHERE invite_code = v_room_code) THEN
    RAISE EXCEPTION 'Room code already exists';
  END IF;

  -- Create room
  INSERT INTO rooms (
    name,
    buy_in,
    max_players,
    is_public,
    invite_code,
    host_id
  ) VALUES (
    p_name,
    p_buy_in,
    p_player_limit,
    p_is_public,
    v_room_code,
    v_user_id
  ) RETURNING id INTO v_room_id;

  -- Auto-join host
  INSERT INTO room_players (room_id, player_id, status)
  VALUES (v_room_id, v_user_id, 'active');

  -- Return room details
  RETURN json_build_object(
    'id', v_room_id,
    'code', v_room_code,
    'name', p_name,
    'buy_in', p_buy_in,
    'player_limit', p_player_limit,
    'is_public', p_is_public
  );
END;
$$;

-- Join room function
CREATE OR REPLACE FUNCTION join_room(
  p_code text DEFAULT NULL,
  p_room_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_user_id uuid;
  v_current_players integer;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Find room by code or ID
  IF p_code IS NOT NULL THEN
    SELECT * INTO v_room FROM rooms WHERE invite_code = upper(p_code);
  ELSIF p_room_id IS NOT NULL THEN
    SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  ELSE
    RAISE EXCEPTION 'Must provide either room code or room ID';
  END IF;

  -- Check if room exists
  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if room is waiting for players
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Room is not accepting new players';
  END IF;

  -- Check if user is already a member
  IF EXISTS (SELECT 1 FROM room_players WHERE room_id = v_room.id AND player_id = v_user_id) THEN
    -- Already a member, just return room details
    RETURN json_build_object(
      'id', v_room.id,
      'code', v_room.invite_code,
      'name', v_room.name,
      'already_member', true
    );
  END IF;

  -- Check room capacity
  SELECT current_players INTO v_current_players FROM rooms WHERE id = v_room.id;
  IF v_current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Join room
  INSERT INTO room_players (room_id, player_id, status)
  VALUES (v_room.id, v_user_id, 'active');

  -- Return room details
  RETURN json_build_object(
    'id', v_room.id,
    'code', v_room.invite_code,
    'name', v_room.name,
    'already_member', false
  );
END;
$$;

-- ============================================================================
-- 7. CREATE VIEWS
-- ============================================================================

-- Public rooms view
CREATE OR REPLACE VIEW public_rooms_view AS
SELECT 
  r.id,
  r.name,
  r.invite_code,
  r.buy_in,
  r.max_players,
  r.current_players,
  r.status,
  r.created_at,
  p.display_name as host_name
FROM rooms r
JOIN profiles p ON r.host_id = p.id
WHERE r.is_public = true 
  AND r.status = 'waiting'
  AND r.current_players < r.max_players
ORDER BY r.created_at DESC;

-- ============================================================================
-- 8. CREATE TRIGGERS
-- ============================================================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for room player count
CREATE TRIGGER on_room_player_added
  AFTER INSERT ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

CREATE TRIGGER on_room_player_removed
  AFTER DELETE ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_room TO authenticated;
GRANT SELECT ON public_rooms_view TO authenticated;

-- ============================================================================
-- 10. INSERT SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample Premier League teams
INSERT INTO pl_teams (team_id, name, short_name) VALUES
(1, 'Arsenal', 'ARS'),
(2, 'Aston Villa', 'AVL'),
(3, 'Brighton & Hove Albion', 'BHA'),
(4, 'Chelsea', 'CHE'),
(5, 'Crystal Palace', 'CRY'),
(6, 'Everton', 'EVE'),
(7, 'Liverpool', 'LIV'),
(8, 'Manchester City', 'MCI'),
(9, 'Manchester United', 'MUN'),
(10, 'Newcastle United', 'NEW'),
(11, 'Tottenham Hotspur', 'TOT'),
(12, 'West Ham United', 'WHU'),
(13, 'Brentford', 'BRE'),
(14, 'Burnley', 'BUR'),
(15, 'Fulham', 'FUL'),
(16, 'Leeds United', 'LEE'),
(17, 'Leicester City', 'LEI'),
(18, 'Nottingham Forest', 'NFO'),
(19, 'Southampton', 'SOU'),
(20, 'Wolverhampton Wanderers', 'WOL')
ON CONFLICT (team_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name;

-- Insert sample gameweek (current date + 1 week)
INSERT INTO gameweeks (gw, deadline_utc, is_current, is_next, is_finished) VALUES
(1, (now() + interval '7 days'), true, false, false),
(2, (now() + interval '14 days'), false, true, false),
(3, (now() + interval '21 days'), false, false, false)
ON CONFLICT (gw) DO UPDATE SET
  deadline_utc = EXCLUDED.deadline_utc,
  is_current = EXCLUDED.is_current,
  is_next = EXCLUDED.is_next,
  is_finished = EXCLUDED.is_finished;

-- Insert sample fixtures for GW1
INSERT INTO fixtures (fixture_id, gw, kickoff_utc, home_team_id, away_team_id) VALUES
(1, 1, (now() + interval '7 days' + interval '2 hours'), 1, 12),   -- Arsenal vs West Ham
(2, 1, (now() + interval '7 days' + interval '5 hours'), 4, 8),    -- Chelsea vs Man City
(3, 1, (now() + interval '7 days' + interval '8 hours'), 7, 9),    -- Liverpool vs Man United
(4, 1, (now() + interval '8 days' + interval '2 hours'), 11, 2),   -- Tottenham vs Aston Villa
(5, 1, (now() + interval '8 days' + interval '5 hours'), 10, 3)    -- Newcastle vs Brighton
ON CONFLICT (fixture_id) DO UPDATE SET
  gw = EXCLUDED.gw,
  kickoff_utc = EXCLUDED.kickoff_utc,
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id;

-- ============================================================================
-- 11. VERIFICATION
-- ============================================================================

SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT 'Functions created:' as info;
SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'update_room_player_count', 'create_room', 'join_room');
