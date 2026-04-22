import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

const TOPICS = ['message.sent', 'member.joined', 'member.removed'];

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private connected = false;

  constructor() {
    const kafka = new Kafka({
      clientId: 'presence-service',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'presence-service-group' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topics: TOPICS, fromBeginning: false });
      this.connected = true;
      await this.consumer.run({ eachMessage: (payload) => this.handleMessage(payload) });
    } catch (err) {
      console.warn('[Kafka] Consumer connect failed — events will be ignored:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.consumer.disconnect().catch(() => {});
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    try {
      const value = message.value?.toString();
      if (!value) return;
      const payload = JSON.parse(value) as Record<string, unknown>;
      console.log(`[Kafka] Received ${topic}:`, payload);
      // Extensible: inject handlers per topic here
    } catch (err) {
      console.warn(`[Kafka] Failed to handle message from ${topic}:`, (err as Error).message);
    }
  }
}
