import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

export class ProfileService {
  static async checkDisplayNameExists(displayName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', displayName)
      .limit(1);

    if (error) {
      console.error('Error checking display name:', error);
      return false;
    }

    return data && data.length > 0;
  }

  static async getProfile(userId?: string): Promise<Profile | null> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Profile doesn't exist
      throw error;
    }

    return data;
  }

  static async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createProfile(profile: {
    id: string;
    email: string;
    display_name?: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStats(userId: string, stats: {
    total_rooms?: number;
    total_wins?: number;
    total_earnings?: number;
    best_streak?: number;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}