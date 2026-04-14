import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':targetId')
  findByTarget(
    @Param('targetId') targetId: string,
    @Query('type') type: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messagesService.findByTarget(
      targetId,
      type || 'group',
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':targetId/read')
  markAsRead(
    @Param('targetId') targetId: string,
    @Query('type') type: string,
    @Request() req: any,
  ) {
    return this.messagesService.markAllAsRead(targetId, type || 'group', req.user.id);
  }
}
