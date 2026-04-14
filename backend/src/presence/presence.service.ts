import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private userToSocket = new Map<string, string>();
  private socketToUser = new Map<string, string>();

  setOnline(userId: string, socketId: string): void {
    this.userToSocket.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
  }

  setOffline(userId: string): void {
    const socketId = this.userToSocket.get(userId);
    if (socketId) this.socketToUser.delete(socketId);
    this.userToSocket.delete(userId);
  }

  setOfflineBySocket(socketId: string): string | undefined {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      this.userToSocket.delete(userId);
      this.socketToUser.delete(socketId);
    }
    return userId;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userToSocket.keys());
  }

  isOnline(userId: string): boolean {
    return this.userToSocket.has(userId);
  }
}
