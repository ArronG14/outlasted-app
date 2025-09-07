import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuthSimple() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuthSimple: Starting auth check');
    
    // Get initial session with timeout
    const timeout = setTimeout(() => {
      console.log('useAuthSimple: Auth check timeout, setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useAuthSimple: Session result:', { session: !!session, error });
      clearTimeout(timeout);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('useAuthSimple: Session error:', error);
      clearTimeout(timeout);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuthSimple: Auth state change:', event, !!session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
