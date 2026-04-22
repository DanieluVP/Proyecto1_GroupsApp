import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Param('groupId') groupId: string, @Body() dto: CreateChannelDto) {
    return this.channelsService.create(groupId, dto.name, dto.description);
  }

  @Get()
  findByGroup(@Param('groupId') groupId: string) {
    return this.channelsService.findByGroup(groupId);
  }
}
