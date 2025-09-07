import { supabase } from '../lib/supabase';
import { Room, RoomPlayer } from '../types/database';

interface CreateRoomParams {
  name: string;
  description?: string;
  buy_in: number;
  max_players: number;
  is_public: boolean;
  dgw_rule?: 'first_only' | 'both_count';
  no_pick_policy?: 'eliminate' | 'random_pick';
  deal_threshold?: number;
  custom_code?: string;
}

interface CreateRoomResponse {
  id: string;
  code: string;
  name: string;
  buy_in: number;
  player_limit: number;
  is_public: boolean;
}

interface JoinRoomResponse {
  id: string;
  code: string;
  name: string;
  already_member: boolean;
}

interface PublicRoom {
  id: string;
  name: string;
  invite_code: string;
  buy_in: number;
  max_players: number;
  current_players: number;
  status: string;
  created_at: string;
  host_name: string;
}

export class RoomService {
  static async createRoom(roomData: CreateRoomParams): Promise<CreateRoomResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Convert buy_in to cents for the database function
    const buyInCents = Math.round(roomData.buy_in * 100);

    const { data, error } = await supabase.rpc('create_room', {
      p_name: roomData.name,
      p_buy_in_cents: buyInCents, // Send as cents (integer)
      p_player_limit: roomData.max_players,
      p_is_public: roomData.is_public,
      p_code: roomData.custom_code || null,
    });

    if (error) {
      console.error('Room creation error:', error);
      throw error;
    }
    
    return data;
  }

  static async joinRoomById(roomId: string): Promise<JoinRoomResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('join_room', {
      p_room_id: roomId,
    });

    if (error) throw error;
    return data;
  }

  static async joinRoomByCode(code: string): Promise<JoinRoomResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('join_room', {
      p_code: code,
    });

    if (error) throw error;
    return data;
  }

  static async getPublicRooms(): Promise<PublicRoom[]> {
    const { data, error } = await supabase
      .from('public_rooms_view')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  static async getUserRooms(status?: 'waiting' | 'active' | 'completed') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('rooms')
      .select(`
        *,
        room_players!inner(status)
      `)
      .eq('room_players.player_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getRoomDetails(roomId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        profiles:host_id (display_name),
        room_players (
          *,
          profiles (display_name, avatar_url)
        )
      `)
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  }
}