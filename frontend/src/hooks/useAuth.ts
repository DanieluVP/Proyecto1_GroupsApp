'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { initSocket, disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const { user, token, setAuth, logout, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (token) {
      initSocket(token);
    }
  }, [token]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push('/login');
  };

  return { user, token, setAuth, logout: handleLogout };
}
