'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';

interface MessageInputProps {
  targetId: string;
  targetType: 'group' | 'channel' | 'dm';
  onSend: (content: string, fileUrl?: string) => void;
  onFileUrl?: (url: string) => void;
  placeholder?: string;
}

export function MessageInput({ targetId, targetType, onSend, placeholder }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    stopTyping();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startTyping = () => {
    const socket = getSocket();
    if (!socket || isTyping) return;
    setIsTyping(true);
    socket.emit('typing:start', { targetId, targetType });
  };

  const stopTyping = () => {
    const socket = getSocket();
    if (!socket || !isTyping) return;
    setIsTyping(false);
    socket.emit('typing:stop', { targetId, targetType });
  };

  const handleChange = (v: string) => {
    setText(v);
    if (v) {
      startTyping();
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(stopTyping, 2000);
    } else {
      stopTyping();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/api/files/upload', formData);
      const { url } = res.data;
      onSend('', url);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-2 bg-gray-700 rounded-xl px-3 py-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1 flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf" onChange={handleFileChange} />

        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder={uploading ? 'Uploading…' : (placeholder ?? 'Message…')}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm leading-relaxed max-h-40 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
          }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
