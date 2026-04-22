import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { registerInConsul } from './shared/consul.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // gRPC server on port 5002 (in parallel to HTTP)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'groups',
      protoPath: join(__dirname, '../../../proto/groups.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 5002}`,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`[groups-service] HTTP on :${port} | gRPC on :${process.env.GRPC_PORT || 5002}`);

  await registerInConsul('groups-service', Number(port));
}
bootstrap();
