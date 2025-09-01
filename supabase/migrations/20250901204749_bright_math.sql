/*
  # FPL Data Cache Tables

  1. New Tables
    - `pl_teams`
      - `team_id` (integer, primary key) - FPL team ID
      - `name` (text, not null) - Full team name
      - `short_name` (text, not null) - Short team name (3 letters)

    - `gameweeks`
      - `gw` (integer, primary key) - Gameweek number
      - `deadline_utc` (timestamptz, not null) - Pick deadline
      - `is_current` (boolean, default false) - Current active gameweek
      - `is_next` (boolean, default false) - Next gameweek
      - `is_finished` (boolean, default false) - Gameweek completed

    - `fixtures`
      - `fixture_id` (integer, primary key) - FPL fixture ID
      - `gw` (integer, not null) - References gameweeks(gw)
      - `kickoff_utc` (timestamptz, not null) - Match kickoff time
      - `home_team_id` (integer, not null) - Home team ID
      - `away_team_id` (integer, not null) - Away team ID

  2. Security
    - Enable RLS on all tables
    - Allow SELECT for authenticated users
    - Deny INSERT/UPDATE from clients (service role only)

  3. Indexes
    - Performance indexes on frequently queried columns
    - Foreign key constraints for data integrity
*/

-- Premier League teams table
CREATE TABLE IF NOT EXISTS pl_teams (
  team_id integer PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL
);

-- Gameweeks table
CREATE TABLE IF NOT EXISTS gameweeks (
  gw integer PRIMARY KEY,
  deadline_utc timestamptz NOT NULL,
  is_current boolean DEFAULT false,
  is_next boolean DEFAULT false,
  is_finished boolean DEFAULT false
);

-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
  fixture_id integer PRIMARY KEY,
  gw integer NOT NULL REFERENCES gameweeks(gw) ON DELETE CASCADE,
  kickoff_utc timestamptz NOT NULL,
  home_team_id integer NOT NULL,
  away_team_id integer NOT NULL
);

-- Enable Row Level Security
ALTER TABLE pl_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow SELECT for authenticated users
CREATE POLICY "Authenticated users can read teams"
  ON pl_teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read gameweeks"
  ON gameweeks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read fixtures"
  ON fixtures
  FOR SELECT
  TO authenticated
  USING (true);

-- Deny INSERT/UPDATE from clients (service role only)
CREATE POLICY "Deny client writes to teams"
  ON pl_teams
  FOR ALL
  TO authenticated
  USING (false);

CREATE POLICY "Deny client writes to gameweeks"
  ON gameweeks
  FOR ALL
  TO authenticated
  USING (false);

CREATE POLICY "Deny client writes to fixtures"
  ON fixtures
  FOR ALL
  TO authenticated
  USING (false);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_gw_kickoff ON fixtures(gw, kickoff_utc);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures(home_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures(away_team_id);
CREATE INDEX IF NOT EXISTS idx_gameweeks_current ON gameweeks(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_gameweeks_next ON gameweeks(is_next) WHERE is_next = true;