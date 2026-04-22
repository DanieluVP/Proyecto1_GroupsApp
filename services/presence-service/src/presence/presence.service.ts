import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  // Online users are tracked by the messaging-service via WebSocket events.
  // This service exposes the REST endpoint and consumes Kafka events.
  getOnlineUsers(): string[] {
    return [];
  }
}
