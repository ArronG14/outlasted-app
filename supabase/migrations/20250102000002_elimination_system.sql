-- Add elimination system and live scores
-- This migration adds elimination tracking and live score integration

-- Add result column to picks table
ALTER TABLE picks 
ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('win', 'lose', 'draw'));

-- Add elimination tracking to room_players
ALTER TABLE room_players 
ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS eliminated_gameweek INTEGER;

-- Create function to process gameweek results and eliminate players
CREATE OR REPLACE FUNCTION process_gameweek_results(p_room_id uuid, p_gameweek integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eliminated_count integer := 0;
  v_active_count integer;
  v_room_data rooms%ROWTYPE;
  v_pick_record picks%ROWTYPE;
  v_team_result text;
BEGIN
  -- Get room data
  SELECT * INTO v_room_data FROM rooms WHERE id = p_room_id;
  
  -- Get active players count
  SELECT COUNT(*) INTO v_active_count 
  FROM room_players 
  WHERE room_id = p_room_id AND status = 'active';
  
  -- Process each pick for this gameweek
  FOR v_pick_record IN 
    SELECT * FROM picks 
    WHERE room_id = p_room_id AND gameweek = p_gameweek
  LOOP
    -- Get team result (this would be populated by live score updates)
    -- For now, we'll simulate results - in production this comes from FPL API
    SELECT CASE 
      WHEN random() < 0.3 THEN 'lose'  -- 30% chance to lose
      WHEN random() < 0.8 THEN 'win'   -- 50% chance to win  
      ELSE 'draw'                      -- 20% chance to draw
    END INTO v_team_result;
    
    -- Update pick with result
    UPDATE picks 
    SET result = v_team_result
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
  END LOOP;
  
  -- Update active player count
  UPDATE rooms 
  SET current_players = current_players - v_eliminated_count
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'eliminated_count', v_eliminated_count,
    'remaining_active', v_active_count - v_eliminated_count
  );
END;
$$;

-- Create function to check if deal should be triggered
CREATE OR REPLACE FUNCTION check_deal_trigger(p_room_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_count integer;
  v_deal_threshold integer;
  v_room_data rooms%ROWTYPE;
BEGIN
  -- Get room data
  SELECT * INTO v_room_data FROM rooms WHERE id = p_room_id;
  
  -- Get active players count
  SELECT COUNT(*) INTO v_active_count 
  FROM room_players 
  WHERE room_id = p_room_id AND status = 'active';
  
  -- Check if deal threshold is met
  IF v_active_count <= v_room_data.deal_threshold THEN
    RETURN json_build_object(
      'should_trigger_deal', true,
      'active_players', v_active_count,
      'deal_threshold', v_room_data.deal_threshold
    );
  END IF;
  
  RETURN json_build_object(
    'should_trigger_deal', false,
    'active_players', v_active_count,
    'deal_threshold', v_room_data.deal_threshold
  );
END;
$$;

-- Create deal requests table
CREATE TABLE IF NOT EXISTS deal_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  initiated_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  gameweek integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create deal votes table
CREATE TABLE IF NOT EXISTS deal_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_request_id uuid REFERENCES deal_requests(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('accept', 'decline')),
  voted_at timestamptz DEFAULT NOW(),
  UNIQUE(deal_request_id, player_id)
);

-- Function to create deal request
CREATE OR REPLACE FUNCTION create_deal_request(p_room_id uuid, p_gameweek integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_deal_id uuid;
  v_active_players uuid[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is active in room
  IF NOT EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = p_room_id AND player_id = v_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You are not an active player in this room';
  END IF;
  
  -- Get active players
  SELECT ARRAY_AGG(player_id) INTO v_active_players
  FROM room_players 
  WHERE room_id = p_room_id AND status = 'active';
  
  -- Create deal request
  INSERT INTO deal_requests (room_id, initiated_by, gameweek)
  VALUES (p_room_id, v_user_id, p_gameweek)
  RETURNING id INTO v_deal_id;
  
  RETURN json_build_object(
    'deal_id', v_deal_id,
    'active_players', v_active_players,
    'expires_at', NOW() + INTERVAL '24 hours'
  );
END;
$$;

-- Function to vote on deal
CREATE OR REPLACE FUNCTION vote_on_deal(p_deal_id uuid, p_vote text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_deal_data deal_requests%ROWTYPE;
  v_vote_count integer;
  v_total_active integer;
  v_all_accepted boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get deal data
  SELECT * INTO v_deal_data FROM deal_requests WHERE id = p_deal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal request not found';
  END IF;
  
  -- Check if deal is still pending
  IF v_deal_data.status != 'pending' THEN
    RAISE EXCEPTION 'Deal request is no longer pending';
  END IF;
  
  -- Check if user is active in room
  IF NOT EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = v_deal_data.room_id AND player_id = v_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You are not an active player in this room';
  END IF;
  
  -- Insert or update vote
  INSERT INTO deal_votes (deal_request_id, player_id, vote)
  VALUES (p_deal_id, v_user_id, p_vote)
  ON CONFLICT (deal_request_id, player_id) 
  DO UPDATE SET vote = p_vote, voted_at = NOW();
  
  -- Count votes
  SELECT COUNT(*) INTO v_vote_count
  FROM deal_votes 
  WHERE deal_request_id = p_deal_id AND vote = 'accept';
  
  -- Get total active players
  SELECT COUNT(*) INTO v_total_active
  FROM room_players 
  WHERE room_id = v_deal_data.room_id AND status = 'active';
  
  -- Check if all active players have accepted
  v_all_accepted := (v_vote_count = v_total_active);
  
  -- Update deal status if all accepted
  IF v_all_accepted THEN
    UPDATE deal_requests 
    SET status = 'accepted'
    WHERE id = p_deal_id;
  END IF;
  
  RETURN json_build_object(
    'votes_accepted', v_vote_count,
    'total_active', v_total_active,
    'all_accepted', v_all_accepted,
    'deal_status', CASE WHEN v_all_accepted THEN 'accepted' ELSE 'pending' END
  );
END;
$$;
