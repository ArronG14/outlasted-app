-- Add round tracking to rooms
-- This migration adds proper round tracking separate from gameweek numbers

-- Add current_round column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;

-- Add round_started_at timestamp
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMPTZ;

-- Update existing rooms to have round 1
UPDATE rooms 
SET current_round = 1, round_started_at = created_at
WHERE current_round IS NULL;

-- Update the create_room function to set initial round
CREATE OR REPLACE FUNCTION create_room(
  p_name text,
  p_buy_in_cents integer,
  p_player_limit integer,
  p_is_public boolean DEFAULT true,
  p_code text DEFAULT NULL,
  p_password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_room_code text;
  v_user_id uuid;
  v_start_gameweek integer;
  v_password_hash text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT MIN(gw) INTO v_start_gameweek
  FROM gameweeks
  WHERE is_finished = false;

  IF v_start_gameweek IS NULL THEN
    v_start_gameweek := 1;
  END IF;

  IF p_code IS NULL OR p_code = '' THEN
    v_room_code := upper(encode(gen_random_bytes(4), 'hex'));
  ELSE
    v_room_code := upper(p_code);
  END IF;

  IF EXISTS (SELECT 1 FROM rooms WHERE invite_code = v_room_code) THEN
    RAISE EXCEPTION 'Room code already exists';
  END IF;

  -- Hash password if provided
  IF p_password IS NOT NULL AND p_password != '' THEN
    v_password_hash := crypt(p_password, gen_salt('bf'));
  END IF;

  INSERT INTO rooms (
    name, buy_in, max_players, is_public, invite_code, host_id, current_gameweek,
    password_hash, is_locked, current_round, round_started_at
  ) VALUES (
    p_name, p_buy_in_cents / 100.0, p_player_limit, p_is_public, v_room_code, v_user_id, v_start_gameweek,
    v_password_hash, (v_password_hash IS NOT NULL), 1, NOW()
  ) RETURNING id INTO v_room_id;

  INSERT INTO room_players (room_id, player_id, status)
  VALUES (v_room_id, v_user_id, 'active');

  RETURN json_build_object(
    'id', v_room_id, 'code', v_room_code, 'name', p_name,
    'buy_in_cents', p_buy_in_cents, 'player_limit', p_player_limit,
    'is_public', p_is_public, 'current_gameweek', v_start_gameweek,
    'is_locked', (v_password_hash IS NOT NULL), 'current_round', 1
  );
END;
$$;

-- Function to advance to next round
CREATE OR REPLACE FUNCTION advance_to_next_round(p_room_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_data rooms%ROWTYPE;
  v_next_gameweek integer;
BEGIN
  -- Get current room data
  SELECT * INTO v_room_data FROM rooms WHERE id = p_room_id;
  
  -- Find next available gameweek
  SELECT MIN(gw) INTO v_next_gameweek
  FROM gameweeks
  WHERE gw > v_room_data.current_gameweek AND is_finished = false;
  
  IF v_next_gameweek IS NOT NULL THEN
    -- Advance to next round and gameweek
    UPDATE rooms 
    SET 
      current_round = current_round + 1,
      current_gameweek = v_next_gameweek,
      round_started_at = NOW(),
      status = 'active'
    WHERE id = p_room_id;
    
    RETURN json_build_object(
      'new_round', v_room_data.current_round + 1,
      'new_gameweek', v_next_gameweek,
      'status', 'active'
    );
  ELSE
    -- No more gameweeks - game is complete
    UPDATE rooms 
    SET status = 'completed'
    WHERE id = p_room_id;
    
    RETURN json_build_object(
      'status', 'completed',
      'message', 'Game completed - no more gameweeks available'
    );
  END IF;
END;
$$;

-- Function to start round 1 (when deadline passes)
CREATE OR REPLACE FUNCTION start_round_1(p_room_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_data rooms%ROWTYPE;
BEGIN
  -- Get current room data
  SELECT * INTO v_room_data FROM rooms WHERE id = p_room_id;
  
  -- Mark round 1 as started
  UPDATE rooms 
  SET 
    round_started_at = NOW(),
    status = 'active',
    round_1_deadline_passed = true
  WHERE id = p_room_id AND current_round = 1;
  
  RETURN json_build_object(
    'round_started', true,
    'round', 1,
    'status', 'active'
  );
END;
$$;
