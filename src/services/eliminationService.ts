import { supabase } from '../lib/supabase';

export interface EliminationResult {
  eliminated_count: number;
  remaining_active: number;
}

export interface DealRequest {
  id: string;
  room_id: string;
  initiated_by: string;
  gameweek: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface DealVote {
  id: string;
  deal_request_id: string;
  player_id: string;
  vote: 'accept' | 'decline';
  voted_at: string;
}

export class EliminationService {
  /**
   * Process gameweek results and eliminate losing players
   */
  static async processGameweekResults(roomId: string, gameweek: number): Promise<EliminationResult> {
    const { data, error } = await supabase.rpc('process_gameweek_results', {
      p_room_id: roomId,
      p_gameweek: gameweek
    });

    if (error) throw error;
    return data;
  }

  /**
   * Check if deal should be triggered
   */
  static async checkDealTrigger(roomId: string): Promise<{should_trigger_deal: boolean, active_players: number, deal_threshold: number}> {
    const { data, error } = await supabase.rpc('check_deal_trigger', {
      p_room_id: roomId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Create a deal request
   */
  static async createDealRequest(roomId: string, gameweek: number): Promise<{deal_id: string, active_players: string[], expires_at: string}> {
    const { data, error } = await supabase.rpc('create_deal_request', {
      p_room_id: roomId,
      p_gameweek: gameweek
    });

    if (error) throw error;
    return data;
  }

  /**
   * Vote on a deal
   */
  static async voteOnDeal(dealId: string, vote: 'accept' | 'decline'): Promise<{votes_accepted: number, total_active: number, all_accepted: boolean, deal_status: string}> {
    const { data, error } = await supabase.rpc('vote_on_deal', {
      p_deal_id: dealId,
      p_vote: vote
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get active deal requests for a room
   */
  static async getActiveDealRequests(roomId: string): Promise<DealRequest[]> {
    const { data, error } = await supabase
      .from('deal_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get deal votes for a request
   */
  static async getDealVotes(dealId: string): Promise<DealVote[]> {
    const { data, error } = await supabase
      .from('deal_votes')
      .select('*')
      .eq('deal_request_id', dealId)
      .order('voted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get player's vote on a deal
   */
  static async getPlayerDealVote(dealId: string, playerId: string): Promise<DealVote | null> {
    const { data, error } = await supabase
      .from('deal_votes')
      .select('*')
      .eq('deal_request_id', dealId)
      .eq('player_id', playerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
