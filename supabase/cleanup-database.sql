-- OUTLASTED Database Cleanup Script
-- Run this in your Supabase SQL editor to completely reset your database

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_room_player_added ON room_players;
DROP TRIGGER IF EXISTS on_room_player_removed ON room_players;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_room_player_count() CASCADE;
DROP FUNCTION IF EXISTS create_room(text, integer, integer, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS join_room(text, uuid) CASCADE;

-- Drop all views
DROP VIEW IF EXISTS public_rooms_view CASCADE;

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS picks CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS fixtures CASCADE;
DROP TABLE IF EXISTS gameweeks CASCADE;
DROP TABLE IF EXISTS pl_teams CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS room_status CASCADE;
DROP TYPE IF EXISTS dgw_rule_type CASCADE;
DROP TYPE IF EXISTS no_pick_policy_type CASCADE;
DROP TYPE IF EXISTS player_status CASCADE;
DROP TYPE IF EXISTS pick_result CASCADE;

-- Reset sequences (if any exist)
-- Note: Supabase handles this automatically, but included for completeness

-- Verify cleanup
SELECT 'Database cleanup completed successfully' as status;
