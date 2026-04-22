import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PresenceModule } from './presence/presence.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    PresenceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
