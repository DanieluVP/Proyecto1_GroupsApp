import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
  ) {}

  async create(content: string, groupId: string, senderId: string): Promise<Message> {
    const group = await this.groupsService.findById(groupId);
    const sender = await this.usersService.findById(senderId);
    if (!sender) throw new NotFoundException('User not found');

    const message = this.messagesRepo.create({ content, group, sender });
    return this.messagesRepo.save(message);
  }

  async findByGroup(groupId: string, limit = 50, offset = 0): Promise<Message[]> {
    return this.messagesRepo.find({
      where: { group: { id: groupId } },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }
}
