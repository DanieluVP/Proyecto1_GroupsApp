'use client';

import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Message } from '@/types';

export function useMessages(
  targetId: string,
  targetType: 'group' | 'channel' | 'dm',
) {
  const { messages, setMessages, addMessage, markRead } = useChatStore();
  const { user } = useAuthStore();
  const currentMessages = messages[targetId] ?? [];

  useEffect(() => {
    if (!targetId) return;
    api
      .get<Message[]>(`/api/messages/${targetId}?type=${targetType}&limit=50`)
      .then((res) => setMessages(targetId, res.data))
      .catch(() => {});
  }, [targetId, targetType, setMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = ({ message }: { message: Message }) => {
      if (message.targetId === targetId || (targetType === 'dm' && isDmMessage(message, targetId, user?.id))) {
        addMessage(targetId, message);
      }
    };

    const onMessageRead = ({
      targetId: tid,
      readBy,
      readAt,
    }: {
      targetId: string;
      readBy: string;
      readAt: string;
    }) => {
      if (tid === targetId) {
        const msgs = messages[targetId] ?? [];
        msgs.forEach((m) => markRead(targetId, m.id, readBy, readAt));
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:read', onMessageRead);
    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:read', onMessageRead);
    };
  }, [targetId, targetType, user?.id, addMessage, markRead, messages]);

  const sendMessage = useCallback(
    (content: string, fileUrl?: string) => {
      const socket = getSocket();
      if (!socket || !content.trim()) return;
      socket.emit('send:message', { targetId, targetType, content: content.trim(), fileUrl });
    },
    [targetId, targetType],
  );

  const markAllRead = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('read:messages', { targetId, targetType });
  }, [targetId, targetType]);

  return { messages: currentMessages, sendMessage, markAllRead };
}

function isDmMessage(message: Message, targetId: string, myId?: string): boolean {
  if (!myId) return false;
  const dmKey = [myId, targetId].sort().join(':');
  return message.targetId === dmKey;
}
