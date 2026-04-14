'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

export function useSocket() {
  const { token } = useAuthStore();
  const joined = useRef<Set<string>>(new Set());

  const joinRoom = (roomId: string, event: 'join:group' | 'join:channel') => {
    const socket = getSocket();
    if (!socket || joined.current.has(roomId)) return;
    socket.emit(event, { [event === 'join:group' ? 'groupId' : 'channelId']: roomId });
    joined.current.add(roomId);
  };

  const leaveRoom = (roomId: string, event: 'leave:group' | 'leave:channel') => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(event, { [event === 'leave:group' ? 'groupId' : 'channelId']: roomId });
    joined.current.delete(roomId);
  };

  useEffect(() => {
    return () => {
      joined.current.clear();
    };
  }, []);

  return { socket: getSocket(), joinRoom, leaveRoom, isConnected: !!token };
}
