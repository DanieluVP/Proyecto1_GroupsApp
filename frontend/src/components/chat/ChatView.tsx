'use client';

import { useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatViewProps {
  targetId: string;
  targetType: 'group' | 'channel' | 'dm';
  currentUserId: string;
  headerSlot?: React.ReactNode;
  placeholder?: string;
}

export function ChatView({ targetId, targetType, currentUserId, headerSlot, placeholder }: ChatViewProps) {
  const { messages, sendMessage, markAllRead } = useMessages(targetId, targetType);
  const { socket, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!socket) return;
    if (targetType === 'group') joinRoom(targetId, 'join:group');
    if (targetType === 'channel') joinRoom(targetId, 'join:channel');
    if (targetType === 'dm') socket.emit('join:dm', { userId: targetId });
    markAllRead();

    return () => {
      if (targetType === 'group') leaveRoom(targetId, 'leave:group');
      if (targetType === 'channel') leaveRoom(targetId, 'leave:channel');
    };
  }, [targetId, targetType, socket]);

  // Auto-mark as read when new messages arrive while the chat is open
  useEffect(() => {
    if (!socket || messages.length === 0) return;
    markAllRead();
  }, [messages.length, socket]);

  return (
    <div className="flex flex-col h-full">
      {headerSlot && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700 bg-gray-800">
          {headerSlot}
        </div>
      )}
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput
        targetId={targetId}
        targetType={targetType}
        onSend={sendMessage}
        placeholder={placeholder}
      />
    </div>
  );
}
