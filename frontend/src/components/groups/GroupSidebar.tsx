'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, LogOut, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CreateGroupModal } from './CreateGroupModal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Group } from '@/types';

export function GroupSidebar() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    api.get<Group[]>('/api/groups').then((r) => setGroups(r.data)).catch(() => {});
  }, []);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <aside className="w-16 bg-gray-950 flex flex-col items-center py-3 gap-2 flex-shrink-0">
      {/* Logo */}
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-2 flex-shrink-0">
        <MessageSquare size={20} className="text-white" />
      </div>

      <div className="w-8 border-b border-gray-700 mb-1" />

      {/* Groups */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto w-full items-center">
        {groups.map((g) => {
          const active = isActive(`/groups/${g.id}`);
          return (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              title={g.name}
              className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:rounded-xl ${
                active ? 'rounded-xl bg-indigo-600' : 'bg-gray-700 hover:bg-indigo-600'
              }`}
            >
              <span className="text-white font-semibold text-sm">
                {g.name.slice(0, 2).toUpperCase()}
              </span>
              {active && (
                <span className="absolute -left-1 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}

        <button
          onClick={() => setShowCreate(true)}
          title="Create group"
          className="w-10 h-10 rounded-2xl bg-gray-700 hover:bg-green-600 hover:rounded-xl transition-all flex items-center justify-center text-gray-400 hover:text-white"
        >
          <Plus size={20} />
        </button>
      </nav>

      {/* User avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-2">
        {user && (
          <div title={user.username}>
            <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
          </div>
        )}
        <button
          onClick={logout}
          title="Logout"
          className="w-8 h-8 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(g) => setGroups((prev) => [g, ...prev])}
      />
    </aside>
  );
}
