import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    private readonly usersService: UsersService,
  ) {}

  async create(name: string, adminId: string): Promise<Group> {
    const admin = await this.usersService.findById(adminId);
    if (!admin) throw new NotFoundException('User not found');

    const group = this.groupsRepo.create({ name, admin, members: [admin] });
    return this.groupsRepo.save(group);
  }

  async addMember(groupId: string, userId: string, requesterId: string): Promise<Group> {
    const group = await this.findById(groupId);
    if (group.admin.id !== requesterId) {
      throw new ForbiddenException('Only the admin can add members');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const alreadyMember = group.members.some((m) => m.id === userId);
    if (!alreadyMember) {
      group.members.push(user);
      await this.groupsRepo.save(group);
    }

    return group;
  }

  async findById(id: string): Promise<Group> {
    const group = await this.groupsRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async findUserGroups(userId: string): Promise<Group[]> {
    return this.groupsRepo
      .createQueryBuilder('group')
      .innerJoin('group.members', 'member', 'member.id = :userId', { userId })
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('group.admin', 'admin')
      .getMany();
  }
}
