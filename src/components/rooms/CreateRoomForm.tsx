import React, { useState } from 'react';
import { X, Users, DollarSign, Settings, Lock, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RoomService } from '../../services/roomService';

interface CreateRoomFormProps {
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function CreateRoomForm({ onClose, onSuccess }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [buyIn, setBuyIn] = useState('10');
  const [maxPlayers, setMaxPlayers] = useState('20');
  const [isPublic, setIsPublic] = useState(true);
  const [customCode, setCustomCode] = useState('');
  const [dgwRule, setDgwRule] = useState<'first_only' | 'both_count'>('first_only');
  const [noPickPolicy, setNoPickPolicy] = useState<'eliminate' | 'random_pick'>('eliminate');
  const [dealThreshold, setDealThreshold] = useState('2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Room name is required');
      setLoading(false);
      return;
    }

    const buyInNum = parseFloat(buyIn);
    const maxPlayersNum = parseInt(maxPlayers);
    const dealThresholdNum = parseInt(dealThreshold);

    if (buyInNum < 0) {
      setError('Buy-in must be 0 or greater');
      setLoading(false);
      return;
    }

    if (maxPlayersNum < 2) {
      setError('Maximum players must be at least 2');
      setLoading(false);
      return;
    }

    if (dealThresholdNum < 2) {
      setError('Deal threshold must be at least 2');
      setLoading(false);
      return;
    }

    try {
      const result = await RoomService.createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        buy_in: buyInNum,
        max_players: maxPlayersNum,
        is_public: isPublic,
        custom_code: customCode.trim() || undefined,
        dgw_rule: dgwRule,
        no_pick_policy: noPickPolicy,
        deal_threshold: dealThresholdNum,
      });

      onSuccess(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#262626] rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#F8F8F6]">Create New Room</h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#F8F8F6] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#F8F8F6] flex items-center gap-2">
              <Settings size={20} />
              Basic Information
            </h3>
            
            <Input
              label="Room Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Premier League Survival 2025"
              required
              className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#D4D4D4]">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your room..."
                rows={3}
                className="w-full px-4 py-3 border border-[#404040] rounded-lg bg-[#171717] text-[#F8F8F6] placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/20 focus:border-[#00E5A0] transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#F8F8F6] flex items-center gap-2">
              <Users size={20} />
              Game Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Buy-in (£)"
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                placeholder="10"
                min="0"
                step="0.01"
                required
                className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
              />
              
              <Input
                label="Max Players"
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="20"
                min="2"
                required
                className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
              />
            </div>

            {!isPublic && (
              <Input
                label="Custom Room Code (Optional)"
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="Leave empty for auto-generated code"
                maxLength={8}
                className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
              />
            )}

            <Input
              label="Deal Threshold"
              type="number"
              value={dealThreshold}
              onChange={(e) => setDealThreshold(e.target.value)}
              placeholder="2"
              min="2"
              required
              className="bg-[#171717] border-[#404040] text-[#F8F8F6] placeholder-[#737373] focus:border-[#00E5A0]"
            />
          </div>

          {/* Privacy & Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#F8F8F6] flex items-center gap-2">
              <Lock size={20} />
              Privacy & Rules
            </h3>
            
            {/* Public/Private Toggle */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#D4D4D4]">
                Room Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    isPublic
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  <Globe size={20} />
                  Public Room
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    !isPublic
                      ? 'bg-[#EE6C4D]/10 border-[#EE6C4D] text-[#EE6C4D]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  <Lock size={20} />
                  Private Room
                </button>
              </div>
            </div>

            {/* Double Gameweek Rule */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#D4D4D4]">
                Double Gameweek Rule
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDgwRule('first_only')}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    dgwRule === 'first_only'
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  First Only
                </button>
                <button
                  type="button"
                  onClick={() => setDgwRule('both_count')}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    dgwRule === 'both_count'
                      ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-[#00E5A0]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  Both Count
                </button>
              </div>
            </div>

            {/* No Pick Policy */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#D4D4D4]">
                No Pick Policy
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setNoPickPolicy('eliminate')}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    noPickPolicy === 'eliminate'
                      ? 'bg-[#EE6C4D]/10 border-[#EE6C4D] text-[#EE6C4D]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  Eliminate
                </button>
                <button
                  type="button"
                  onClick={() => setNoPickPolicy('random_pick')}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    noPickPolicy === 'random_pick'
                      ? 'bg-[#EE6C4D]/10 border-[#EE6C4D] text-[#EE6C4D]'
                      : 'bg-[#171717] border-[#404040] text-[#737373] hover:border-[#737373]'
                  }`}
                >
                  Random Pick
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-[#DC2626] bg-[#DC2626]/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#404040] text-[#D4D4D4] hover:bg-[#404040]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00E5A0] text-black hover:bg-[#00E5A0]/90"
              disabled={loading}
            >
              <DollarSign size={20} />
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}