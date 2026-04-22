import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepo: Repository<GroupMember>,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(name: string, adminId: string, description?: string): Promise<Group> {
    const group = this.groupsRepo.create({ name, description, adminId });
    const saved = await this.groupsRepo.save(group);

    const member = this.groupMembersRepo.create({ groupId: saved.id, userId: adminId, role: 'admin' });
    await this.groupMembersRepo.save(member);

    await this.kafka.emit('member.joined', { groupId: saved.id, userId: adminId, role: 'admin' });

    return this.findById(saved.id);
  }

  async findById(id: string): Promise<Group> {
    const group = await this.groupsRepo.findOne({
      where: { id },
      relations: ['groupMembers'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async findUserGroups(userId: string): Promise<Group[]> {
    return this.groupsRepo
      .createQueryBuilder('group')
      .innerJoin('group.groupMembers', 'myMembership', 'myMembership.userId = :userId', { userId })
      .leftJoinAndSelect('group.groupMembers', 'allMembers')
      .orderBy('group.createdAt', 'DESC')
      .getMany();
  }

  async addMember(groupId: string, userId: string, requesterId: string): Promise<GroupMember> {
    const group = await this.findById(groupId);
    if (group.adminId !== requesterId) {
      throw new ForbiddenException('Only admin can add members');
    }

    const existing = await this.groupMembersRepo.findOne({ where: { groupId, userId } });
    if (existing) throw new ConflictException('User is already a member');

    const member = this.groupMembersRepo.create({ groupId, userId, role: 'member' });
    const saved = await this.groupMembersRepo.save(member);

    await this.kafka.emit('member.joined', { groupId, userId, role: 'member' });

    return saved;
  }

  async removeMember(groupId: string, userId: string, requesterId: string): Promise<void> {
    const group = await this.findById(groupId);
    if (group.adminId !== requesterId) {
      throw new ForbiddenException('Only admin can remove members');
    }
    if (group.adminId === userId) {
      throw new ForbiddenException('Cannot remove the admin from the group');
    }
    await this.groupMembersRepo.delete({ groupId, userId });

    await this.kafka.emit('member.removed', { groupId, userId });
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await this.groupMembersRepo.count({ where: { groupId, userId } });
    return count > 0;
  }

  async findMember(groupId: string, userId: string): Promise<GroupMember | null> {
    return this.groupMembersRepo.findOne({ where: { groupId, userId } });
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMembersRepo.find({ where: { groupId } });
  }
}
