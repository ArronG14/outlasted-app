-- Add rematch system
-- This migration adds rematch voting and room reset functionality

-- Create rematch votes table
CREATE TABLE IF NOT EXISTS rematch_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no')),
  voted_at timestamptz DEFAULT NOW(),
  UNIQUE(room_id, player_id)
);

-- Function to reset room for rematch
CREATE OR REPLACE FUNCTION reset_room_for_rematch(p_room_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_data rooms%ROWTYPE;
  v_start_gameweek integer;
BEGIN
  -- Get room data
  SELECT * INTO v_room_data FROM rooms WHERE id = p_room_id;
  
  -- Find next available gameweek
  SELECT MIN(gw) INTO v_start_gameweek
  FROM gameweeks
  WHERE is_finished = false;
  
  IF v_start_gameweek IS NULL THEN
    v_start_gameweek := 1;
  END IF;
  
  -- Reset room state
  UPDATE rooms 
  SET 
    current_round = 1,
    current_gameweek = v_start_gameweek,
    status = 'waiting',
    round_1_deadline_passed = false,
    round_started_at = NOW()
  WHERE id = p_room_id;
  
  -- Reset all player statuses to active
  UPDATE room_players 
  SET 
    status = 'active',
    eliminated_at = NULL,
    eliminated_gameweek = NULL
  WHERE room_id = p_room_id;
  
  -- Delete all picks
  DELETE FROM picks WHERE room_id = p_room_id;
  
  -- Delete all rematch votes
  DELETE FROM rematch_votes WHERE room_id = p_room_id;
  
  -- Delete all deal requests and votes
  DELETE FROM deal_votes WHERE deal_request_id IN (
    SELECT id FROM deal_requests WHERE room_id = p_room_id
  );
  DELETE FROM deal_requests WHERE room_id = p_room_id;
  
  RETURN json_build_object(
    'success', true,
    'new_gameweek', v_start_gameweek,
    'message', 'Room reset for rematch'
  );
END;
$$;

-- Function to automatically process gameweek results
CREATE OR REPLACE FUNCTION auto_process_gameweek_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_record RECORD;
  v_fixture_record RECORD;
  v_team_results JSONB;
  v_eliminated_count integer;
  v_remaining_active integer;
BEGIN
  -- Get all active rooms
  FOR v_room_record IN 
    SELECT id, current_gameweek, current_round
    FROM rooms 
    WHERE status = 'active'
  LOOP
    -- Check if current gameweek is finished
    -- This would be called by the Netlify function with actual FPL data
    -- For now, we'll just log the room
    RAISE NOTICE 'Processing room % for gameweek %', v_room_record.id, v_room_record.current_gameweek;
  END LOOP;
END;
$$;

-- Function to check if gameweek is finished
CREATE OR REPLACE FUNCTION is_gameweek_finished(p_gameweek integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_finished_count integer;
  v_total_count integer;
BEGIN
  -- Count finished fixtures for this gameweek
  SELECT 
    COUNT(*) FILTER (WHERE finished = true),
    COUNT(*)
  INTO v_finished_count, v_total_count
  FROM fixtures 
  WHERE gw = p_gameweek;
  
  -- Gameweek is finished if all fixtures are finished
  RETURN v_finished_count = v_total_count AND v_total_count > 0;
END;
$$;

-- Function to get next available gameweek
CREATE OR REPLACE FUNCTION get_next_available_gameweek(p_current_gameweek integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_gameweek integer;
BEGIN
  SELECT MIN(gw) 
  INTO v_next_gameweek
  FROM gameweeks 
  WHERE gw > p_current_gameweek 
    AND is_finished = false;
  
  RETURN v_next_gameweek;
END;
$$;

-- Function to process elimination results
CREATE OR REPLACE FUNCTION process_elimination_results(
  p_room_id uuid,
  p_gameweek integer,
  p_team_results JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pick_record RECORD;
  v_team_result text;
  v_eliminated_count integer := 0;
  v_remaining_active integer;
BEGIN
  -- Process each pick for this room and gameweek
  FOR v_pick_record IN 
    SELECT * FROM picks 
    WHERE room_id = p_room_id AND gameweek = p_gameweek
  LOOP
    -- Get team result from JSONB
    v_team_result := p_team_results->>v_pick_record.team_name;
    
    IF v_team_result IS NOT NULL THEN
      -- Update pick with result
      UPDATE picks 
      SET 
        result = v_team_result::text,
        is_locked = true
      WHERE id = v_pick_record.id;
      
      -- If team lost, eliminate player
      IF v_team_result = 'lose' THEN
        UPDATE room_players 
        SET 
          status = 'eliminated',
          eliminated_at = NOW(),
          eliminated_gameweek = p_gameweek
        WHERE room_id = p_room_id 
          AND player_id = v_pick_record.player_id 
          AND status = 'active';
        
        v_eliminated_count := v_eliminated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- Get remaining active players
  SELECT COUNT(*) 
  INTO v_remaining_active
  FROM room_players 
  WHERE room_id = p_room_id AND status = 'active';
  
  -- Update room player count
  UPDATE rooms 
  SET current_players = v_remaining_active
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'eliminated_count', v_eliminated_count,
    'remaining_active', v_remaining_active
  );
END;
$$;
