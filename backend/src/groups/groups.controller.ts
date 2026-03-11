import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req: any) {
    return this.groupsService.create(dto.name, req.user.id);
  }

  @Get()
  findMyGroups(@Request() req: any) {
    return this.groupsService.findUserGroups(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Request() req: any) {
    return this.groupsService.addMember(id, dto.userId, req.user.id);
  }
}
