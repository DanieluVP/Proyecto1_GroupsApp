import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(MessageRead)
    private readonly messageReadsRepo: Repository<MessageRead>,
  ) {}

  async create(
    content: string,
    senderId: string,
    targetId: string,
    targetType: string,
    fileUrl?: string,
  ): Promise<Message> {
    const msg = this.messagesRepo.create({ content, senderId, targetId, targetType, fileUrl });
    const saved = await this.messagesRepo.save(msg);
    return this.messagesRepo.findOne({
      where: { id: saved.id },
      relations: ['sender', 'reads'],
    }) as Promise<Message>;
  }

  findByTarget(targetId: string, targetType: string, limit = 50, offset = 0): Promise<Message[]> {
    return this.messagesRepo.find({
      where: { targetId, targetType },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
      relations: ['sender', 'reads', 'reads.user'],
    });
  }

  async markAsRead(messageId: string, userId: string): Promise<MessageRead> {
    let read = await this.messageReadsRepo.findOne({ where: { messageId, userId } });
    if (!read) {
      read = this.messageReadsRepo.create({ messageId, userId });
    }
    return this.messageReadsRepo.save(read);
  }

  async markAllAsRead(targetId: string, targetType: string, userId: string): Promise<void> {
    const messages = await this.messagesRepo.find({ where: { targetId, targetType } });
    await Promise.all(messages.map((m) => this.markAsRead(m.id, userId)));
  }

  getReadReceipts(messageId: string): Promise<MessageRead[]> {
    return this.messageReadsRepo.find({
      where: { messageId },
      relations: ['user'],
    });
  }
}
