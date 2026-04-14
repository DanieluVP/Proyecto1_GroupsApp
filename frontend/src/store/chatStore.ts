'use client';

import { create } from 'zustand';
import { Message } from '@/types';

interface ChatState {
  messages: Record<string, Message[]>;
  addMessage: (targetId: string, message: Message) => void;
  setMessages: (targetId: string, messages: Message[]) => void;
  markRead: (targetId: string, messageId: string, userId: string, readAt: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  addMessage: (targetId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [targetId]: [...(state.messages[targetId] ?? []), message],
      },
    })),
  setMessages: (targetId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [targetId]: messages },
    })),
  markRead: (targetId, messageId, userId, readAt) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [targetId]: (state.messages[targetId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, reads: [...(m.reads ?? []), { messageId, userId, readAt }] }
            : m,
        ),
      },
    })),
}));
