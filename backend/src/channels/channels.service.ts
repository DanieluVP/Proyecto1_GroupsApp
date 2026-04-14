import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepo: Repository<Channel>,
    private readonly groupsService: GroupsService,
  ) {}

  async create(groupId: string, name: string, description?: string): Promise<Channel> {
    await this.groupsService.findById(groupId);
    const channel = this.channelsRepo.create({ groupId, name, description });
    return this.channelsRepo.save(channel);
  }

  findByGroup(groupId: string): Promise<Channel[]> {
    return this.channelsRepo.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<Channel> {
    const channel = await this.channelsRepo.findOne({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }
}
