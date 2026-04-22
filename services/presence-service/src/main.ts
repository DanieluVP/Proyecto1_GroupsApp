import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerInConsul } from './shared/consul.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  console.log(`[presence-service] Running on http://localhost:${port}/api`);

  await registerInConsul('presence-service', Number(port));
}
bootstrap();
