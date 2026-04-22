import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom, Observable } from 'rxjs';
import { MessagesService } from '../messages/messages.service';

interface GroupsServiceGrpc {
  isMember(data: { groupId: string; userId: string }): Observable<{ isMember: boolean; role: string }>;
}

interface SendMessagePayload {
  targetId: string;
  targetType: 'group' | 'channel' | 'dm';
  content: string;
  fileUrl?: string;
}

interface TypingPayload {
  targetId: string;
  targetType: string;
}

interface ReadPayload {
  targetId: string;
  targetType: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private groupsService!: GroupsServiceGrpc;
  // socketId -> { userId, username }
  private socketToUser = new Map<string, { userId: string; username: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    @Inject('GROUPS_GRPC') private readonly groupsGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.groupsService = this.groupsGrpcClient.getService<GroupsServiceGrpc>('GroupsService');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string; username: string }>(token);
      this.socketToUser.set(client.id, { userId: payload.sub, username: payload.username });

      // Send new client the current online users before broadcasting their own arrival
      const onlineIds = new Set([...this.socketToUser.values()].map((u) => u.userId));
      onlineIds.forEach((uid) =>
        client.emit('presence:update', { userId: uid, status: 'online' }),
      );

      // Broadcast to everyone that this user is now online
      this.server.emit('presence:update', { userId: payload.sub, status: 'online' });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.socketToUser.get(client.id);
    this.socketToUser.delete(client.id);
    if (user) {
      const stillConnected = [...this.socketToUser.values()].some((u) => u.userId === user.userId);
      if (!stillConnected) {
        this.server.emit('presence:update', { userId: user.userId, status: 'offline' });
      }
    }
  }

  private getUser(client: Socket): { userId: string; username: string } | undefined {
    return this.socketToUser.get(client.id);
  }

  @SubscribeMessage('join:group')
  handleJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    client.join(data.groupId);
  }

  @SubscribeMessage('leave:group')
  handleLeaveGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    client.leave(data.groupId);
  }

  @SubscribeMessage('join:channel')
  handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.join(data.channelId);
  }

  @SubscribeMessage('leave:channel')
  handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.leave(data.channelId);
  }

  @SubscribeMessage('join:dm')
  handleJoinDm(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    const user = this.getUser(client);
    if (!user) return;
    client.join(this.getDmRoom(user.userId, data.userId));
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload,
  ) {
    const user = this.getUser(client);
    if (!user) return;

    // Verify group membership via gRPC (E3-2)
    if (data.targetType === 'group') {
      try {
        const { isMember } = await firstValueFrom(
          this.groupsService.isMember({ groupId: data.targetId, userId: user.userId }),
        );
        if (!isMember) {
          client.emit('error', { message: 'No eres miembro de este grupo' });
          return;
        }
      } catch {
        // If groups-service is unreachable, fall through (graceful degradation)
        console.warn('[chat] groups-service gRPC unavailable, skipping membership check');
      }
    }

    const message = await this.messagesService.create(
      data.content,
      user.userId,
      data.targetId,
      data.targetType,
      data.fileUrl,
      user.username,
    );

    const room =
      data.targetType === 'dm' ? this.getDmRoom(user.userId, data.targetId) : data.targetId;

    this.server.to(room).emit('message:new', { message });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: TypingPayload) {
    const user = this.getUser(client);
    if (!user) return;
    client.to(data.targetId).emit('typing:update', {
      userId: user.userId,
      targetId: data.targetId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: TypingPayload) {
    const user = this.getUser(client);
    if (!user) return;
    client.to(data.targetId).emit('typing:update', {
      userId: user.userId,
      targetId: data.targetId,
      isTyping: false,
    });
  }

  @SubscribeMessage('read:messages')
  async handleReadMessages(@ConnectedSocket() client: Socket, @MessageBody() data: ReadPayload) {
    const user = this.getUser(client);
    if (!user) return;

    await this.messagesService.markAllAsRead(data.targetId, data.targetType, user.userId);
    client.to(data.targetId).emit('message:read', {
      targetId: data.targetId,
      readBy: user.userId,
      readAt: new Date(),
    });
  }

  private getDmRoom(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join(':');
  }
}
