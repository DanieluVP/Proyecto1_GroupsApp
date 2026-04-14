import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { GroupsService } from '../groups/groups.service';

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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    private readonly groupsService: GroupsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string }>(token);
      this.socketToUser.set(client.id, payload.sub);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.socketToUser.delete(client.id);
  }

  private getUserId(client: Socket): string | undefined {
    return this.socketToUser.get(client.id);
  }

  @SubscribeMessage('join:group')
  handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(data.groupId);
  }

  @SubscribeMessage('leave:group')
  handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.leave(data.groupId);
  }

  @SubscribeMessage('join:channel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(data.channelId);
  }

  @SubscribeMessage('leave:channel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(data.channelId);
  }

  @SubscribeMessage('send:message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;

    if (data.targetType === 'group') {
      const isMember = await this.groupsService.isMember(data.targetId, userId);
      if (!isMember) return;
    }

    const message = await this.messagesService.create(
      data.content,
      userId,
      data.targetId,
      data.targetType,
      data.fileUrl,
    );

    const room = data.targetType === 'dm' ? this.getDmRoom(userId, data.targetId) : data.targetId;
    this.server.to(room).emit('message:new', { message });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    client.to(data.targetId).emit('typing:update', { userId, targetId: data.targetId, isTyping: true });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;
    client.to(data.targetId).emit('typing:update', { userId, targetId: data.targetId, isTyping: false });
  }

  @SubscribeMessage('read:messages')
  async handleReadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ReadPayload,
  ) {
    const userId = this.getUserId(client);
    if (!userId) return;

    await this.messagesService.markAllAsRead(data.targetId, data.targetType, userId);
    client.to(data.targetId).emit('message:read', { targetId: data.targetId, readBy: userId, readAt: new Date() });
  }

  private getDmRoom(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join(':');
  }
}
