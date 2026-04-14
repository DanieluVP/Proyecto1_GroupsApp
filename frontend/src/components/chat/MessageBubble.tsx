import { Message } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { ReadReceipt } from './ReadReceipt';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  showSender?: boolean;
}

export function MessageBubble({ message, currentUserId, showSender = true }: MessageBubbleProps) {
  const isOwn = message.senderId === currentUserId;
  const sender = message.sender;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-2 px-4 py-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && sender && showSender && (
        <div className="flex-shrink-0 mt-1">
          <Avatar username={sender.username} avatarUrl={sender.avatarUrl} size="sm" />
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && sender && showSender && (
          <span className="text-xs text-gray-400 mb-1 ml-1">{sender.username}</span>
        )}

        <div
          className={`relative rounded-2xl px-3 py-2 break-words ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-700 text-gray-100 rounded-tl-sm'
          }`}
        >
          {message.fileUrl && isImage(message.fileUrl) && (
            <img
              src={message.fileUrl}
              alt="attachment"
              className="rounded-lg max-w-xs max-h-60 object-contain mb-1"
            />
          )}
          {message.fileUrl && !isImage(message.fileUrl) && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-300 underline text-sm"
            >
              📎 Attachment
            </a>
          )}
          {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}

          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] opacity-60">{time}</span>
            <ReadReceipt
              reads={message.reads ?? []}
              senderId={message.senderId}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function isImage(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url);
}
