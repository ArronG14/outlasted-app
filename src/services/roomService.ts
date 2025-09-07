import { supabase } from '../lib/supabase';

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
  password?: string;
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Creating room with data:', roomData);
      console.log('User ID:', user.id);

      // Convert buy_in to cents for the database function
      const buyInCents = Math.round(roomData.buy_in * 100);
      console.log('Buy-in in cents:', buyInCents);

      const { data, error } = await supabase.rpc('create_room', {
        p_name: roomData.name,
        p_buy_in_cents: buyInCents,
        p_player_limit: roomData.max_players,
        p_is_public: roomData.is_public,
        p_code: roomData.custom_code || null,
        p_password: roomData.password || null,
      });

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('Room creation error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Room creation failed:', err);
      throw err;
    }
  }

  static async joinRoomById(roomId: string, password?: string): Promise<JoinRoomResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if room requires password
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('is_locked, invite_code')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      throw new Error('Room not found');
    }

    // If room is locked and no password provided, use password function
    if (room.is_locked && !password) {
      throw new Error('This room requires a password');
    }

    // If room is locked and password provided, use password function
    if (room.is_locked && password) {
      const { data, error } = await supabase.rpc('join_room_with_password', {
        p_room_code: room.invite_code,
        p_password: password,
      });

      if (error) throw error;
      return data;
    }

    // For public rooms without passwords, use the simple join_room function
    const { data, error } = await supabase.rpc('join_room', {
      p_room_id: roomId
    });

    if (error) throw error;
    return data;
  }

  static async joinRoomByCode(code: string, password?: string): Promise<JoinRoomResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('join_room_with_password', {
      p_room_code: code,
      p_password: password || null,
    });

    if (error) throw error;
    return data;
  }

  static async getPublicRooms(): Promise<PublicRoom[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get all public rooms
    const { data: allRooms, error: roomsError } = await supabase
      .from('public_rooms_view')
      .select('*');

    if (roomsError) throw roomsError;

    // Get rooms the user is already in
    const { data: userRooms, error: userRoomsError } = await supabase
      .from('room_players')
      .select('room_id')
      .eq('player_id', user.id);

    if (userRoomsError) throw userRoomsError;

    // Filter out rooms the user is already in
    const userRoomIds = userRooms?.map(ur => ur.room_id) || [];
    const filteredRooms = allRooms?.filter(room => !userRoomIds.includes(room.id)) || [];

    return filteredRooms;
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
    console.log('Getting room details for:', roomId);
    
    // First get the room data
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    console.log('Room data:', roomData);
    console.log('Room error:', roomError);

    if (roomError) {
      console.error('Room fetch failed:', roomError);
      throw roomError;
    }

    // Try to get the host profile (optional - might not exist)
    let hostProfile = null;
    try {
      const { data: profileData, error: hostError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', roomData.host_id)
        .single();

      if (!hostError && profileData) {
        hostProfile = profileData;
        console.log('Host profile found:', hostProfile);
      } else {
        console.log('Host profile not found, using fallback');
      }
    } catch (err) {
      console.log('Host profile fetch failed, using fallback:', err);
    }

    // Get room players (also handle missing profiles gracefully)
    let players = [];
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('room_players')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .eq('room_id', roomId);

      if (!playersError && playersData) {
        // Clean up players data - only use fallback if profile is truly missing
        players = playersData.map(player => {
          // If profiles is null or undefined, use fallback
          if (!player.profiles) {
            return {
              ...player,
              profiles: { display_name: 'Player', avatar_url: null }
            };
          }
          // Otherwise, keep the real profile data
          return player;
        });
      } else {
        console.log('Players fetch failed:', playersError);
      }
    } catch (err) {
      console.log('Players fetch failed:', err);
    }

    return {
      ...roomData,
      profiles: hostProfile || { display_name: 'Host' },
      room_players: players || []
    };
  }
}