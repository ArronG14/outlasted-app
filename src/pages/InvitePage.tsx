import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, DollarSign, Loader2 } from 'lucide-react';
import { RoomService } from '../services/roomService';
import { useAuth } from '../hooks/useAuth';

export function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to sign in with next parameter
      navigate(`/?next=/invite/${code}`);
      return;
    }

    if (code) {
      handleJoinByCode();
    }
  }, [user, authLoading, code]);

  const handleJoinByCode = async () => {
    if (!code) return;

    try {
      setLoading(true);
      setError('');
      
      const result = await RoomService.joinRoomByCode(code);
      
      if (result.already_member) {
        // Already a member, just redirect
        navigate(`/rooms/${result.id}`);
      } else {
        // Successfully joined, show success and redirect
        setRoomInfo(result);
        setTimeout(() => {
          navigate(`/rooms/${result.id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      // Redirect to join page with error after a delay
      setTimeout(() => {
        navigate('/join', { 
          state: { 
            error: err instanceof Error ? err.message : 'Failed to join room',
            code: code 
          } 
        });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5A0] mx-auto mb-4"></div>
          <p className="text-[#F8F8F6] text-lg">
            {authLoading ? 'Checking authentication...' : 'Joining room...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl p-6 mb-6">
            <h1 className="text-2xl font-bold text-[#DC2626] mb-2">
              Unable to Join Room
            </h1>
            <p className="text-[#F8F8F6]">{error}</p>
          </div>
          <p className="text-[#737373]">
            Redirecting to join page...
          </p>
        </div>
      </div>
    );
  }

  if (roomInfo) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-[#00E5A0]/10 border border-[#00E5A0]/30 rounded-xl p-6 mb-6">
            <h1 className="text-2xl font-bold text-[#00E5A0] mb-2">
              Successfully Joined!
            </h1>
            <p className="text-[#F8F8F6] mb-4">
              Welcome to <strong>{roomInfo.name}</strong>
            </p>
            <div className="flex items-center justify-center gap-4 text-[#D4D4D4]">
              <span className="flex items-center gap-1">
                <Users size={16} />
                Room Code: {roomInfo.code}
              </span>
            </div>
          </div>
          <p className="text-[#737373]">
            Redirecting to room...
          </p>
        </div>
      </div>
    );
  }

  return null;
}