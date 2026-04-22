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

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`[files-service] Running on http://localhost:${port}/api`);

  await registerInConsul('files-service', Number(port));
}
bootstrap();
