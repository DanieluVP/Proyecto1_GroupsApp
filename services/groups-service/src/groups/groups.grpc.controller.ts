import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GroupsService } from './groups.service';

@Controller()
export class GroupsGrpcController {
  constructor(private readonly groupsService: GroupsService) {}

  @GrpcMethod('GroupsService', 'IsMember')
  async isMember({ groupId, userId }: { groupId: string; userId: string }) {
    const member = await this.groupsService.findMember(groupId, userId);
    return { isMember: !!member, role: member?.role || '' };
  }

  @GrpcMethod('GroupsService', 'GetGroupMembers')
  async getGroupMembers({ groupId }: { groupId: string }) {
    const members = await this.groupsService.getMembers(groupId);
    return { userIds: members.map((m) => m.userId) };
  }
}
