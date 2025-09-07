import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface RematchSystemProps {
  roomId: string;
  onRematchStarted?: () => void;
}

interface RematchVote {
  id: string;
  player_id: string;
  vote: 'yes' | 'no';
  voted_at: string;
  profiles: {
    display_name: string;
  };
}

export function RematchSystem({ roomId, onRematchStarted }: RematchSystemProps) {
  const [rematchVotes, setRematchVotes] = useState<RematchVote[]>([]);
  const [userVote, setUserVote] = useState<'yes' | 'no' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRematchModal, setShowRematchModal] = useState(false);

  useEffect(() => {
    loadRematchVotes();
  }, [roomId]);

  const loadRematchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('rematch_votes')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .eq('room_id', roomId)
        .order('voted_at', { ascending: true });

      if (error) throw error;
      setRematchVotes(data || []);

      // Get current user's vote
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userVoteData = data?.find(vote => vote.player_id === user.id);
        setUserVote(userVoteData?.vote || null);
      }
    } catch (err) {
      console.error('Error loading rematch votes:', err);
    }
  };

  const handleVote = async (vote: 'yes' | 'no') => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert or update vote
      const { error } = await supabase
        .from('rematch_votes')
        .upsert({
          room_id: roomId,
          player_id: user.id,
          vote: vote
        });

      if (error) throw error;

      setUserVote(vote);
      await loadRematchVotes();

      // Check if all players have voted
      const { data: allPlayers } = await supabase
        .from('room_players')
        .select('player_id')
        .eq('room_id', roomId);

      if (allPlayers && rematchVotes.length + 1 >= allPlayers.length) {
        // All players have voted, process rematch
        await processRematch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote on rematch');
    } finally {
      setLoading(false);
    }
  };

  const processRematch = async () => {
    try {
      const yesVotes = rematchVotes.filter(vote => vote.vote === 'yes').length;
      const totalVotes = rematchVotes.length;

      if (yesVotes === totalVotes && yesVotes > 0) {
        // All players want to rematch
        await startRematch();
      } else {
        // Not everyone wants to rematch, remove players who voted no
        await removeNonRematchPlayers();
      }
    } catch (err) {
      console.error('Error processing rematch:', err);
    }
  };

  const startRematch = async () => {
    try {
      // Reset room state for rematch
      const { error } = await supabase.rpc('reset_room_for_rematch', {
        p_room_id: roomId
      });

      if (error) throw error;

      setShowRematchModal(false);
      onRematchStarted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start rematch');
    }
  };

  const removeNonRematchPlayers = async () => {
    try {
      const noVoters = rematchVotes
        .filter(vote => vote.vote === 'no')
        .map(vote => vote.player_id);

      if (noVoters.length > 0) {
        // Remove players who voted no
        const { error } = await supabase
          .from('room_players')
          .delete()
          .eq('room_id', roomId)
          .in('player_id', noVoters);

        if (error) throw error;

        // Update room player count
        const { data: remainingPlayers } = await supabase
          .from('room_players')
          .select('id')
          .eq('room_id', roomId);

        await supabase
          .from('rooms')
          .update({ current_players: remainingPlayers?.length || 0 })
          .eq('id', roomId);
      }

      // Start rematch with remaining players
      await startRematch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process rematch');
    }
  };

  const initiateRematch = () => {
    setShowRematchModal(true);
  };

  const yesVotes = rematchVotes.filter(vote => vote.vote === 'yes').length;
  const noVotes = rematchVotes.filter(vote => vote.vote === 'no').length;
  const totalVotes = rematchVotes.length;

  return (
    <div className="space-y-4">
      {/* Rematch Button */}
      <div className="text-center">
        <Button
          onClick={initiateRematch}
          className="bg-gradient-to-r from-[#00E5A0] to-green-500 text-black hover:from-green-400 hover:to-green-600 font-semibold px-8 py-3"
        >
          <RefreshCw className="mr-2" size={20} />
          Start Rematch
        </Button>
      </div>

      {/* Rematch Modal */}
      {showRematchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 rounded-xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="text-[#00E5A0]" size={24} />
                <h3 className="text-xl font-semibold text-white">Rematch Vote</h3>
              </div>
              
              <p className="text-white/80 mb-6">
                Do you want to start a new game with the same players? 
                All picks and eliminations will be reset.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Votes to Rematch:</span>
                  <span className="text-green-400 font-semibold">
                    {yesVotes} / {totalVotes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Your Vote:</span>
                  <span className={userVote === 'yes' ? 'text-green-400' : userVote === 'no' ? 'text-red-400' : 'text-white/50'}>
                    {userVote ? userVote.charAt(0).toUpperCase() + userVote.slice(1) : 'Not voted'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm mb-4 bg-red-500/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleVote('yes')}
                  disabled={loading || userVote === 'yes'}
                  className="flex-1 bg-green-500 text-black hover:bg-green-400"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Yes, Rematch
                </Button>
                <Button
                  onClick={() => handleVote('no')}
                  disabled={loading || userVote === 'no'}
                  className="flex-1 bg-red-500 text-white hover:bg-red-400"
                >
                  <XCircle size={16} className="mr-2" />
                  No, Leave
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  onClick={() => setShowRematchModal(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vote Status */}
      {rematchVotes.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-white font-semibold mb-3">Rematch Votes</h4>
          <div className="space-y-2">
            {rematchVotes.map((vote) => (
              <div key={vote.id} className="flex items-center justify-between text-sm">
                <span className="text-white/80">{vote.profiles.display_name}</span>
                <div className="flex items-center gap-2">
                  {vote.vote === 'yes' ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : (
                    <XCircle className="text-red-400" size={16} />
                  )}
                  <span className={vote.vote === 'yes' ? 'text-green-400' : 'text-red-400'}>
                    {vote.vote === 'yes' ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
