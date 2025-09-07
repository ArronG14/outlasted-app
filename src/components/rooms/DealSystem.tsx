import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { EliminationService, DealRequest, DealVote } from '../../services/eliminationService';
import { GameStateService } from '../../services/gameStateService';
import { supabase } from '../../lib/supabase';

interface DealSystemProps {
  roomId: string;
  currentGameweek: number;
  activePlayers: number;
  dealThreshold: number;
  onDealAccepted?: () => void;
}

export function DealSystem({ roomId, currentGameweek, activePlayers, dealThreshold, onDealAccepted }: DealSystemProps) {
  const [dealRequests, setDealRequests] = useState<DealRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDealModal, setShowDealModal] = useState(false);
  const [currentDeal, setCurrentDeal] = useState<DealRequest | null>(null);
  const [dealVotes, setDealVotes] = useState<DealVote[]>([]);
  const [userVote, setUserVote] = useState<'accept' | 'decline' | null>(null);

  useEffect(() => {
    loadDealRequests();
  }, [roomId]);

  const loadDealRequests = async () => {
    try {
      const requests = await EliminationService.getActiveDealRequests(roomId);
      setDealRequests(requests);
      
      // Auto-show deal modal if there's a pending request
      if (requests.length > 0) {
        setCurrentDeal(requests[0]);
        setShowDealModal(true);
        loadDealVotes(requests[0].id);
      }
    } catch (err) {
      console.error('Error loading deal requests:', err);
    }
  };

  const loadDealVotes = async (dealId: string) => {
    try {
      const votes = await EliminationService.getDealVotes(dealId);
      setDealVotes(votes);
      
      // Get current user's vote
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const playerVote = await EliminationService.getPlayerDealVote(dealId, user.id);
        setUserVote(playerVote?.vote || null);
      }
    } catch (err) {
      console.error('Error loading deal votes:', err);
    }
  };

  const handleCreateDeal = async () => {
    try {
      setLoading(true);
      setError('');
      await EliminationService.createDealRequest(roomId, currentGameweek);
      await loadDealRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal request');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: 'accept' | 'decline') => {
    if (!currentDeal) return;

    try {
      setLoading(true);
      setError('');
      const result = await EliminationService.voteOnDeal(currentDeal.id, vote);
      setUserVote(vote);
      
      if (result.all_accepted) {
        setShowDealModal(false);
        onDealAccepted?.();
      } else {
        await loadDealVotes(currentDeal.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote on deal');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowDealButton = activePlayers <= dealThreshold && activePlayers > 1;

  return (
    <div className="space-y-4">
      {/* Deal Trigger Info */}
      {shouldShowDealButton && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-400" size={20} />
            <p className="text-yellow-400 font-semibold">Deal Threshold Reached!</p>
          </div>
          <p className="text-yellow-300 text-sm">
            Only {activePlayers} players remain (threshold: {dealThreshold}). 
            Any player can initiate a deal to split the winnings.
          </p>
          <Button
            onClick={handleCreateDeal}
            disabled={loading || dealRequests.length > 0}
            className="mt-3 bg-yellow-500 text-black hover:bg-yellow-400"
          >
            {loading ? 'Creating...' : 'Initiate Deal'}
          </Button>
        </div>
      )}

      {/* Deal Modal */}
      {showDealModal && currentDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 rounded-xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-[#00E5A0]" size={24} />
                <h3 className="text-xl font-semibold text-white">Deal Proposal</h3>
              </div>
              
              <p className="text-white/80 mb-4">
                A player has proposed to split the winnings equally among all {activePlayers} remaining players.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Votes to Accept:</span>
                  <span className="text-green-400 font-semibold">
                    {dealVotes.filter(v => v.vote === 'accept').length} / {activePlayers}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Your Vote:</span>
                  <span className={userVote === 'accept' ? 'text-green-400' : userVote === 'decline' ? 'text-red-400' : 'text-white/50'}>
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
                  onClick={() => handleVote('accept')}
                  disabled={loading || userVote === 'accept'}
                  className="flex-1 bg-green-500 text-black hover:bg-green-400"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Accept Deal
                </Button>
                <Button
                  onClick={() => handleVote('decline')}
                  disabled={loading || userVote === 'decline'}
                  className="flex-1 bg-red-500 text-white hover:bg-red-400"
                >
                  <XCircle size={16} className="mr-2" />
                  Decline
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  onClick={() => setShowDealModal(false)}
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
    </div>
  );
}
