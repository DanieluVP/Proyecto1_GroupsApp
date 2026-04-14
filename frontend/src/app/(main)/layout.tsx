'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { initSocket } from '@/lib/socket';
import { GroupSidebar } from '@/components/groups/GroupSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { token, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      router.replace('/login');
    } else if (!token) {
      // still initializing
    } else {
      initSocket(token);
    }
  }, [token, router]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-800">
      <GroupSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
