'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Hash, ArrowLeft } from 'lucide-react';
import { ChatView } from '@/components/chat/ChatView';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Channel } from '@/types';

export default function ChannelPage({
  params,
}: {
  params: Promise<{ groupId: string; channelId: string }>;
}) {
  const { groupId, channelId } = use(params);
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    api
      .get<Channel[]>(`/api/groups/${groupId}/channels`)
      .then((r) => {
        const ch = r.data.find((c) => c.id === channelId);
        if (ch) setChannel(ch);
      })
      .catch(() => {});
  }, [groupId, channelId]);

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      <ChatView
        targetId={channelId}
        targetType="channel"
        currentUserId={user.id}
        headerSlot={
          <div className="flex items-center gap-2">
            <Link
              href={`/groups/${groupId}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <Hash size={18} className="text-gray-400" />
            <span className="font-semibold text-white">{channel?.name ?? '…'}</span>
            {channel?.description && (
              <span className="text-gray-400 text-sm hidden md:block">— {channel.description}</span>
            )}
          </div>
        }
        placeholder={`Message #${channel?.name ?? 'channel'}`}
      />
    </div>
  );
}
