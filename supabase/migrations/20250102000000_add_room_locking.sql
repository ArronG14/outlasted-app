-- Add room locking and password functionality
-- This migration adds password protection and lock status to rooms

-- Add new columns to rooms table
ALTER TABLE rooms 
ADD COLUMN password_hash TEXT,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN locked_at TIMESTAMPTZ,
ADD COLUMN round_1_deadline_passed BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX idx_rooms_is_locked ON rooms(is_locked);
CREATE INDEX idx_rooms_password_hash ON rooms(password_hash) WHERE password_hash IS NOT NULL;

-- Update the create_room function to handle passwords
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
    password_hash, is_locked
  ) VALUES (
    p_name, p_buy_in_cents / 100.0, p_player_limit, p_is_public, v_room_code, v_user_id, v_start_gameweek,
    v_password_hash, (v_password_hash IS NOT NULL)
  ) RETURNING id INTO v_room_id;

  INSERT INTO room_players (room_id, player_id, status)
  VALUES (v_room_id, v_user_id, 'active');

  RETURN json_build_object(
    'id', v_room_id, 'code', v_room_code, 'name', p_name,
    'buy_in_cents', p_buy_in_cents, 'player_limit', p_player_limit,
    'is_public', p_is_public, 'current_gameweek', v_start_gameweek,
    'is_locked', (v_password_hash IS NOT NULL)
  );
END;
$$;

-- Function to lock/unlock a room
CREATE OR REPLACE FUNCTION toggle_room_lock(
  p_room_id uuid,
  p_password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_room_host_id uuid;
  v_password_hash text;
  v_is_locked boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user is the host
  SELECT host_id INTO v_room_host_id
  FROM rooms
  WHERE id = p_room_id;

  IF v_room_host_id != v_user_id THEN
    RAISE EXCEPTION 'Only the host can lock/unlock the room';
  END IF;

  -- Get current lock status
  SELECT is_locked INTO v_is_locked
  FROM rooms
  WHERE id = p_room_id;

  -- Hash password if provided
  IF p_password IS NOT NULL AND p_password != '' THEN
    v_password_hash := crypt(p_password, gen_salt('bf'));
  END IF;

  -- Toggle lock status
  UPDATE rooms
  SET 
    is_locked = NOT v_is_locked,
    password_hash = CASE 
      WHEN NOT v_is_locked THEN v_password_hash
      ELSE NULL
    END,
    locked_at = CASE 
      WHEN NOT v_is_locked THEN NOW()
      ELSE NULL
    END
  WHERE id = p_room_id;

  RETURN json_build_object(
    'is_locked', NOT v_is_locked,
    'has_password', (v_password_hash IS NOT NULL)
  );
END;
$$;

-- Function to join room with password verification
CREATE OR REPLACE FUNCTION join_room_with_password(
  p_room_code text,
  p_password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_user_id uuid;
  v_room_data rooms%ROWTYPE;
  v_password_hash text;
  v_password_valid boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Find room by code
  SELECT * INTO v_room_data
  FROM rooms
  WHERE invite_code = upper(p_room_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if room is locked and requires password
  IF v_room_data.is_locked THEN
    IF p_password IS NULL OR p_password = '' THEN
      RAISE EXCEPTION 'This room requires a password';
    END IF;

    -- Verify password
    v_password_valid := (v_room_data.password_hash = crypt(p_password, v_room_data.password_hash));
    IF NOT v_password_valid THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;

  -- Check if user is already in the room
  IF EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = v_room_data.id AND player_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are already in this room';
  END IF;

  -- Check if room is full
  IF v_room_data.current_players >= v_room_data.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Check if round 1 deadline has passed (no new joins allowed)
  IF v_room_data.round_1_deadline_passed THEN
    RAISE EXCEPTION 'Cannot join room after Round 1 deadline has passed';
  END IF;

  -- Add player to room
  INSERT INTO room_players (room_id, player_id, status)
  VALUES (v_room_data.id, v_user_id, 'active');

  -- Update player count
  UPDATE rooms
  SET current_players = current_players + 1
  WHERE id = v_room_data.id;

  RETURN json_build_object(
    'room_id', v_room_data.id,
    'room_name', v_room_data.name,
    'success', true
  );
END;
$$;
