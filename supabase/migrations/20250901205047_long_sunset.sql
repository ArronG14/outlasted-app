-- Seed script for local development
-- Run this in your Supabase SQL editor to add sample data

-- Insert sample teams
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
(12, 'West Ham United', 'WHU')
ON CONFLICT (team_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name;

-- Insert sample gameweek
INSERT INTO gameweeks (gw, deadline_utc, is_current, is_next, is_finished) VALUES
(1, '2025-08-16 17:30:00+00', true, false, false),
(2, '2025-08-24 17:30:00+00', false, true, false),
(3, '2025-08-31 17:30:00+00', false, false, false)
ON CONFLICT (gw) DO UPDATE SET
  deadline_utc = EXCLUDED.deadline_utc,
  is_current = EXCLUDED.is_current,
  is_next = EXCLUDED.is_next,
  is_finished = EXCLUDED.is_finished;

-- Insert sample fixtures for GW1
INSERT INTO fixtures (fixture_id, gw, kickoff_utc, home_team_id, away_team_id) VALUES
(1, 1, '2025-08-16 19:30:00+00', 1, 12),  -- Arsenal vs West Ham
(2, 1, '2025-08-17 16:30:00+00', 4, 8),   -- Chelsea vs Man City
(3, 1, '2025-08-17 19:00:00+00', 7, 9),   -- Liverpool vs Man United
(4, 1, '2025-08-18 15:00:00+00', 11, 2),  -- Tottenham vs Aston Villa
(5, 1, '2025-08-18 17:30:00+00', 10, 3)   -- Newcastle vs Brighton
ON CONFLICT (fixture_id) DO UPDATE SET
  gw = EXCLUDED.gw,
  kickoff_utc = EXCLUDED.kickoff_utc,
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id;