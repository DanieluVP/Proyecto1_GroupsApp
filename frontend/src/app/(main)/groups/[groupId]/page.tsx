'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Hash, Users, Plus, ChevronRight, UserPlus, Search } from 'lucide-react';
import { ChatView } from '@/components/chat/ChatView';
import { MemberList } from '@/components/groups/MemberList';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Group, Channel, User, GroupMember } from '@/types';

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Group>(`/api/groups/${groupId}`).then((r) => setGroup(r.data)).catch(() => {});
    api.get<Channel[]>(`/api/groups/${groupId}/channels`).then((r) => setChannels(r.data)).catch(() => {});
  }, [groupId]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    setCreating(true);
    try {
      const r = await api.post<Channel>(`/api/groups/${groupId}/channels`, { name: newChannel.trim() });
      setChannels((p) => [...p, r.data]);
      setNewChannel('');
      setShowAddChannel(false);
    } catch {}
    finally { setCreating(false); }
  };

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const r = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
    const memberIds = new Set((group?.groupMembers ?? []).map((m: GroupMember) => m.userId));
    setSearchResults(r.data.filter((u) => !memberIds.has(u.id) && u.id !== user?.id));
  };

  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    try {
      await api.post(`/api/groups/${groupId}/members`, { userId });
      const r = await api.get<Group>(`/api/groups/${groupId}`);
      setGroup(r.data);
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch {}
    finally { setAddingUserId(null); }
  };

  if (!user) return null;

  const members = group?.groupMembers ?? [];
  const isAdmin = group?.adminId === user.id;

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <div className="w-56 border-r border-gray-700 flex flex-col flex-shrink-0" style={{ backgroundColor: '#1e2430' }}>
        <div className="px-3 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold truncate">{group?.name ?? '…'}</h2>
          {group?.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{group.description}</p>
          )}
        </div>

        {/* Channels list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
            {isAdmin && (
              <button onClick={() => setShowAddChannel(true)} className="text-gray-400 hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            )}
          </div>
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/groups/${groupId}/${ch.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md mx-1 transition-colors text-sm"
            >
              <Hash size={14} className="flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </Link>
          ))}
        </div>

        {/* Members button */}
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-2 px-3 py-3 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-t border-gray-700 text-sm"
        >
          <Users size={15} />
          <span>{members.length} members</span>
          <ChevronRight size={14} className="ml-auto" />
        </button>
      </div>

      {/* Main chat — group general */}
      <div className="flex-1 overflow-hidden">
        <ChatView
          targetId={groupId}
          targetType="group"
          currentUserId={user.id}
          headerSlot={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-gray-400" />
                <span className="font-semibold text-white">general</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(true)}
                  title="Add member"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <UserPlus size={18} />
                </button>
              )}
            </div>
          }
          placeholder="Message #general"
        />
      </div>

      {/* Members modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title={`Members (${members.length})`}>
        <div className="space-y-2">
          <MemberList members={members} adminId={group?.adminId ?? ''} />
          {isAdmin && (
            <button
              onClick={() => { setShowMembers(false); setShowAddMember(true); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors text-sm"
            >
              <UserPlus size={15} /> Add member
            </button>
          )}
        </div>
      </Modal>

      {/* Add member modal */}
      <Modal open={showAddMember} onClose={() => { setShowAddMember(false); setSearchQ(''); setSearchResults([]); }} title="Add member">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username…"
              className="w-full bg-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {searchResults.length === 0 && searchQ.length >= 2 && (
            <p className="text-gray-500 text-sm text-center py-2">No users found</p>
          )}

          <div className="space-y-1 max-h-52 overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-700">
                <div>
                  <p className="text-sm text-white">{u.username}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <Button
                  size="sm"
                  loading={addingUserId === u.id}
                  onClick={() => handleAddMember(u.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Add channel modal */}
      <Modal open={showAddChannel} onClose={() => setShowAddChannel(false)} title="New channel">
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <input
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            placeholder="channel-name"
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setShowAddChannel(false)}>Cancel</Button>
            <Button loading={creating} type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
