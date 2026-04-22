'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket, onSocketChange } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const joined = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSocketInstance(getSocket());
    return onSocketChange(() => setSocketInstance(getSocket()));
  }, []);

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

  return { socket: socketInstance, joinRoom, leaveRoom };
}
