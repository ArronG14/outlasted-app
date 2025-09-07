import React, { useState } from 'react';
import { RoomService } from '../../services/roomService';
import { supabase } from '../../lib/supabase';

interface RoomDebugProps {
  roomId: string;
}

export function RoomDebug({ roomId }: RoomDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('Running room debug for ID:', roomId);
      
      // Test 1: Check if room exists in database
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      console.log('Room query result:', { roomData, roomError });

      // Test 2: Check if user is in the room
      const { data: { user } } = await supabase.auth.getUser();
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('player_id', user?.id)
        .single();

      console.log('Player query result:', { playerData, playerError });

      // Test 3: Try RoomService method
      let roomServiceResult = null;
      let roomServiceError = null;
      try {
        roomServiceResult = await RoomService.getRoomDetails(roomId);
      } catch (err) {
        roomServiceError = err;
      }

      setDebugInfo({
        roomId,
        user: user ? { id: user.id, email: user.email } : null,
        roomQuery: { data: roomData, error: roomError },
        playerQuery: { data: playerData, error: playerError },
        roomService: { data: roomServiceResult, error: roomServiceError }
      });

    } catch (err) {
      console.error('Debug error:', err);
      setDebugInfo({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 m-4">
      <h3 className="text-lg font-semibold text-red-400 mb-4">Room Debug Info</h3>
      
      <button
        onClick={runDebug}
        disabled={loading}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4 hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? 'Running Debug...' : 'Run Debug'}
      </button>

      {debugInfo && (
        <pre className="bg-black/50 p-4 rounded text-xs overflow-auto max-h-96 text-white">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}
