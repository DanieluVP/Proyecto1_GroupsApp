import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(MessageRead)
    private readonly messageReadsRepo: Repository<MessageRead>,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(
    content: string,
    senderId: string,
    targetId: string,
    targetType: string,
    fileUrl?: string,
    senderUsername?: string,
  ): Promise<Message & { sender: { id: string; username: string } }> {
    const msg = this.messagesRepo.create({
      content,
      senderId,
      senderUsername,
      targetId,
      targetType,
      fileUrl,
    });
    const saved = await this.messagesRepo.save(msg);
    const withReads = await this.messagesRepo.findOne({
      where: { id: saved.id },
      relations: ['reads'],
    });

    await this.kafka.emit('message.sent', {
      messageId: saved.id,
      senderId,
      senderUsername,
      targetId,
      targetType,
      content,
      fileUrl,
      createdAt: saved.createdAt,
    });

    return { ...(withReads ?? saved), sender: { id: senderId, username: senderUsername || 'Unknown' } };
  }

  async findByTarget(
    targetId: string,
    targetType: string,
    limit = 50,
    offset = 0,
  ): Promise<(Message & { sender: { id: string; username: string } })[]> {
    const messages = await this.messagesRepo.find({
      where: { targetId, targetType },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
      relations: ['reads'],
    });
    return messages.map((m) => ({
      ...m,
      sender: { id: m.senderId, username: m.senderUsername || 'Unknown' },
    }));
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
    return this.messageReadsRepo.find({ where: { messageId } });
  }
}
