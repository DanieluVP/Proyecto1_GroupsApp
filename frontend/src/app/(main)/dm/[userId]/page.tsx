'use client';

import { use, useEffect, useState } from 'react';
import { ChatView } from '@/components/chat/ChatView';
import { Avatar } from '@/components/ui/Avatar';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { useAuthStore } from '@/store/authStore';
import { usePresence } from '@/hooks/usePresence';
import api from '@/lib/api';
import { User } from '@/types';

export default function DmPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: me } = useAuthStore();
  const [other, setOther] = useState<User | null>(null);
  const { isOnline } = usePresence();

  useEffect(() => {
    api.get<User>(`/api/users/${userId}`).then((r) => setOther(r.data)).catch(() => {});
  }, [userId]);

  if (!me) return null;

  // DM target is a sorted pair key so both sides query the same messages
  const dmTargetId = [me.id, userId].sort().join(':');

  return (
    <div className="flex h-full flex-col">
      <ChatView
        targetId={dmTargetId}
        targetType="dm"
        currentUserId={me.id}
        headerSlot={
          other ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar username={other.username} avatarUrl={other.avatarUrl} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineIndicator online={isOnline(other.id)} />
                </span>
              </div>
              <span className="font-semibold text-white">{other.username}</span>
              <span className="text-xs text-gray-400">{isOnline(other.id) ? 'Online' : 'Offline'}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Loading…</span>
          )
        }
        placeholder={`Message ${other?.username ?? '…'}`}
      />
    </div>
  );
}
