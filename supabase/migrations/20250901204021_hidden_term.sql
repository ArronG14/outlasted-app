/*
  # Room Management Functions and Views

  1. Database Functions (RPCs)
    - `create_room` - Creates room and auto-joins host
    - `join_room` - Joins room by code or ID with validation
    
  2. Views
    - `public_rooms_view` - Public rooms with player counts
    
  3. Additional RLS Policies
    - Enhanced room access policies
    - Room membership policies
*/

-- Create room function
CREATE OR REPLACE FUNCTION create_room(
  p_name text,
  p_buy_in_cents integer,
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
    p_buy_in_cents / 100.0,
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
    'buy_in_cents', p_buy_in_cents,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_room TO authenticated;
GRANT SELECT ON public_rooms_view TO authenticated;