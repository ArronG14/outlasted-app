-- 🎯 Create Test Room Script for OUTLASTED
-- This script creates a test room with all players and their picks for Gameweek 5

-- 1. Create the test room
INSERT INTO rooms (
  id,
  name,
  description,
  buy_in,
  max_players,
  current_players,
  is_public,
  invite_code,
  host_id,
  current_gameweek,
  status,
  dgw_rule,
  no_pick_policy,
  deal_threshold,
  current_round,
  round_started_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'NEW TEST 1',
  'Test room for Gameweek 5 with all players and picks',
  10.00,
  4,
  4,
  true,
  'TEST1',
  'e2f907be-0867-4d42-8eaa-8985adc2191b', -- adey_of as host
  5, -- Gameweek 5
  'active',
  'first_only',
  'eliminate',
  2,
  1,
  now(),
  now() - interval '2 days', -- Created 2 days ago (before deadline)
  now()
) RETURNING id;

-- 2. Add all players to the room
-- Note: You'll need to replace the room_id with the actual ID returned above

-- Add adey_of (host)
INSERT INTO room_players (
  room_id,
  player_id,
  status,
  joined_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'e2f907be-0867-4d42-8eaa-8985adc2191b',
  'active',
  now() - interval '2 days'
);

-- Add Amm4n10
INSERT INTO room_players (
  room_id,
  player_id,
  status,
  joined_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'ade493fa-b410-4de5-b274-cd31d7a1fd57',
  'active',
  now() - interval '2 days'
);

-- Add AG14z
INSERT INTO room_players (
  room_id,
  player_id,
  status,
  joined_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'a9b21feb-ebde-4481-8691-151124979690',
  'active',
  now() - interval '2 days'
);

-- Add Outlasted Demo
INSERT INTO room_players (
  room_id,
  player_id,
  status,
  joined_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  '3ebe1ca3-6f92-4f87-8dd1-902922eba483',
  'active',
  now() - interval '2 days'
);

-- 3. Add picks for Gameweek 5 (based on your specific choices)
-- adey_of picks Manchester United (won 2-1 vs Chelsea) - SURVIVES
INSERT INTO picks (
  room_id,
  player_id,
  gameweek,
  team_name,
  is_locked,
  result,
  created_at,
  locked_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'e2f907be-0867-4d42-8eaa-8985adc2191b',
  5,
  'Man Utd',
  true,
  'win',
  now() - interval '2 days',
  now() - interval '1 day'
);

-- Amm4n10 picks Wolves (lost 1-3 vs Leeds) - ELIMINATED (loss)
INSERT INTO picks (
  room_id,
  player_id,
  gameweek,
  team_name,
  is_locked,
  result,
  created_at,
  locked_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'ade493fa-b410-4de5-b274-cd31d7a1fd57',
  5,
  'Wolves',
  true,
  'lose',
  now() - interval '2 days',
  now() - interval '1 day'
);

-- AG14z picks Crystal Palace (won 2-1 vs West Ham) - SURVIVES
INSERT INTO picks (
  room_id,
  player_id,
  gameweek,
  team_name,
  is_locked,
  result,
  created_at,
  locked_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  'a9b21feb-ebde-4481-8691-151124979690',
  5,
  'Crystal Palace',
  true,
  'win',
  now() - interval '2 days',
  now() - interval '1 day'
);

-- Outlasted Demo picks Leeds (won 3-1 vs Wolves) - SURVIVES
INSERT INTO picks (
  room_id,
  player_id,
  gameweek,
  team_name,
  is_locked,
  result,
  created_at,
  locked_at
) VALUES (
  (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1),
  '3ebe1ca3-6f92-4f87-8dd1-902922eba483',
  5,
  'Leeds',
  true,
  'win',
  now() - interval '2 days',
  now() - interval '1 day'
);

-- 4. Update player statuses based on results
-- adey_of survives (Man Utd won) - stays 'active'
-- AG14z survives (Crystal Palace won) - stays 'active'  
-- Outlasted Demo survives (Leeds won) - stays 'active'

-- Amm4n10 eliminated (Wolves lost)
UPDATE room_players 
SET 
  status = 'eliminated',
  eliminated_at = now() - interval '1 hour',
  eliminated_gameweek = 5
WHERE 
  room_id = (SELECT id FROM rooms WHERE name = 'NEW TEST 1' LIMIT 1)
  AND player_id = 'ade493fa-b410-4de5-b274-cd31d7a1fd57';

-- 5. Update room player count
UPDATE rooms 
SET 
  current_players = 3, -- 3 players survive (adey_of, AG14z, Outlasted Demo)
  updated_at = now()
WHERE 
  name = 'NEW TEST 1';

-- 6. Verify the setup
SELECT 
  r.name as room_name,
  r.current_players,
  r.status as room_status,
  p.display_name,
  rp.status as player_status,
  pk.team_name,
  pk.result as pick_result
FROM rooms r
JOIN room_players rp ON r.id = rp.room_id
JOIN profiles p ON rp.player_id = p.id
LEFT JOIN picks pk ON r.id = pk.room_id AND rp.player_id = pk.player_id AND pk.gameweek = 5
WHERE r.name = 'NEW TEST 1'
ORDER BY p.display_name;
