export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  createdAt: string;
  groupMembers?: GroupMember[];
  admin?: User;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface Channel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  targetId: string;
  targetType: 'group' | 'channel' | 'dm';
  fileUrl?: string;
  createdAt: string;
  sender?: User;
  reads?: MessageRead[];
}

export interface MessageRead {
  messageId: string;
  userId: string;
  readAt: string;
}

export type PresenceStatus = 'online' | 'offline';
