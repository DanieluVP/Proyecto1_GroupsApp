import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;
  private connected = false;

  constructor() {
    const kafka = new Kafka({
      clientId: 'messaging-service',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.connected = true;
    } catch (err) {
      console.warn('[Kafka] Producer connect failed — events will be skipped:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }

  async emit(topic: string, payload: object): Promise<void> {
    if (!this.connected) return;
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
    } catch (err) {
      console.warn(`[Kafka] Failed to emit to ${topic}:`, (err as Error).message);
    }
  }
}
