import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    MessagesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
      }),
    }),
    ClientsModule.register([
      {
        name: 'GROUPS_GRPC',
        transport: Transport.GRPC,
        options: {
          package: 'groups',
          protoPath: join(__dirname, '../../../../proto/groups.proto'),
          url: process.env.GROUPS_SERVICE_GRPC || 'groups-service:5002',
        },
      },
    ]),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
