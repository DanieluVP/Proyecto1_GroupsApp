'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { initSocket } from '@/lib/socket';
import { GroupSidebar } from '@/components/groups/GroupSidebar';
import { usePresence } from '@/hooks/usePresence';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { token, initialized, init } = useAuthStore();
  const router = useRouter();
  usePresence();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!token) {
      router.replace('/login');
    } else {
      initSocket(token);
    }
  }, [token, initialized, router]);

  if (!initialized) {
    return null;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-800">
      <GroupSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
