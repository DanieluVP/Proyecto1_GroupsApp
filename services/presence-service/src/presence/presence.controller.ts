import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PresenceService } from './presence.service';

@Controller('presence')
@UseGuards(AuthGuard('jwt'))
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('online')
  getOnlineUsers(): { userIds: string[] } {
    return { userIds: this.presenceService.getOnlineUsers() };
  }
}
