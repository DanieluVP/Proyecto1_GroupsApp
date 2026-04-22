'use client';

import { useEffect } from 'react';
import { usePresenceStore } from '@/store/presenceStore';
import { getSocket, onSocketChange } from '@/lib/socket';

export function usePresence() {
  const { onlineUsers, setOnline, setOffline, isOnline } = usePresenceStore();

  useEffect(() => {
    function setup() {
      const socket = getSocket();
      if (!socket) return;

      // Seed comes automatically from the server on connection (presence:update events)
      const handler = ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
        if (status === 'online') setOnline(userId);
        else setOffline(userId);
      };

      socket.on('presence:update', handler);
      return () => socket.off('presence:update', handler);
    }

    const cleanup = setup();
    const unsubscribe = onSocketChange(() => {
      cleanup?.();
      setup();
    });

    return () => {
      cleanup?.();
      unsubscribe();
    };
  }, [setOnline, setOffline]);

  return { onlineUsers, isOnline };
}
