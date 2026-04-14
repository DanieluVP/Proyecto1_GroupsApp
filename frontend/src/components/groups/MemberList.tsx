'use client';

import { GroupMember } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { usePresence } from '@/hooks/usePresence';

interface MemberListProps {
  members: GroupMember[];
  adminId: string;
}

export function MemberList({ members, adminId }: MemberListProps) {
  const { isOnline } = usePresence();

  return (
    <div className="space-y-1">
      {members.map((m) => {
        const user = m.user;
        if (!user) return null;
        const online = isOnline(user.id);
        return (
          <div key={m.userId} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="relative">
              <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5">
                <OnlineIndicator online={online} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{user.username}</p>
            </div>
            {user.id === adminId && (
              <span className="text-[10px] text-yellow-400 font-medium">admin</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
