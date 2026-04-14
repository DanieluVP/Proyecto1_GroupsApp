'use client';

import { useEffect } from 'react';
import { usePresenceStore } from '@/store/presenceStore';
import { getSocket } from '@/lib/socket';

export function usePresence() {
  const { onlineUsers, setOnline, setOffline, isOnline } = usePresenceStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      if (status === 'online') setOnline(userId);
      else setOffline(userId);
    };

    socket.on('presence:update', handler);
    return () => {
      socket.off('presence:update', handler);
    };
  }, [setOnline, setOffline]);

  return { onlineUsers, isOnline };
}
