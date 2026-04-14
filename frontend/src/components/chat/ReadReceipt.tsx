import { MessageRead } from '@/types';
import { Check } from 'lucide-react';

interface ReadReceiptProps {
  reads: MessageRead[];
  senderId: string;
  currentUserId: string;
}

export function ReadReceipt({ reads, senderId, currentUserId }: ReadReceiptProps) {
  if (senderId !== currentUserId) return null;

  const readByOthers = reads.filter((r) => r.userId !== currentUserId);
  const isRead = readByOthers.length > 0;

  return (
    <span className="flex items-center ml-1 flex-shrink-0">
      {isRead ? (
        // ✓✓ azul = leído
        <span className="flex text-blue-400">
          <Check size={12} strokeWidth={3} className="-mr-1" />
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        // ✓ gris = enviado
        <Check size={12} strokeWidth={3} className="text-gray-400" />
      )}
    </span>
  );
}
