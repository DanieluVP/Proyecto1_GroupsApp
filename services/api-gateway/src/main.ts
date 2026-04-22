import { NestFactory } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { registerInConsul } from './shared/consul.helper';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { firstValueFrom, Observable } from 'rxjs';

interface AuthServiceGrpc {
  validateToken(data: { token: string }): Observable<{
    valid: boolean;
    userId: string;
    email: string;
    username: string;
  }>;
}

// Public paths that skip JWT validation (relative to /api mount point)
const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/health', '/files/local'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3006',
    credentials: true,
  });

  // Get gRPC auth client from DI container
  const grpcClient = app.get<ClientGrpc>('AUTH_GRPC');
  const authGrpcService = grpcClient.getService<AuthServiceGrpc>('AuthService');

  const http = app.getHttpAdapter().getInstance();

  const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
  const groupsUrl = process.env.GROUPS_SERVICE_URL || 'http://groups-service:3002';
  const messagingUrl = process.env.MESSAGING_SERVICE_URL || 'http://messaging-service:3003';
  const presenceUrl = process.env.PRESENCE_SERVICE_URL || 'http://presence-service:3004';
  const filesUrl = process.env.FILES_SERVICE_URL || 'http://files-service:3005';

  // JWT validation middleware (runs first, before all proxies)
  http.use('/api', async (req: any, res: any, next: () => void) => {
    if (PUBLIC_PATHS.some((p) => req.path === p || req.path.startsWith(p))) {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }

    try {
      const result = await firstValueFrom(authGrpcService.validateToken({ token }));
      if (!result.valid) {
        res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
        return;
      }
      // Inject user info as headers for downstream services
      req.headers['x-user-id'] = result.userId;
      req.headers['x-user-email'] = result.email;
      req.headers['x-user-username'] = result.username;
      next();
    } catch {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    }
  });

  // Strip CORS headers from upstream responses — the gateway owns CORS
  const stripCors = (proxyRes: any) => {
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-methods'];
    delete proxyRes.headers['access-control-allow-headers'];
    delete proxyRes.headers['access-control-allow-credentials'];
  };

  // WebSocket proxy for Socket.IO (messaging-service)
  http.use(createProxyMiddleware({
    target: messagingUrl,
    changeOrigin: true,
    ws: true,
    pathFilter: '/socket.io',
  }));

  // HTTP proxies — use pathFilter so Express does NOT strip the prefix
  http.use(createProxyMiddleware({ target: authUrl, changeOrigin: true, pathFilter: ['/api/auth', '/api/users'], on: { proxyRes: stripCors } }));
  http.use(createProxyMiddleware({ target: groupsUrl, changeOrigin: true, pathFilter: '/api/groups', on: { proxyRes: stripCors } }));
  http.use(createProxyMiddleware({ target: messagingUrl, changeOrigin: true, pathFilter: '/api/messages', on: { proxyRes: stripCors } }));
  http.use(createProxyMiddleware({ target: presenceUrl, changeOrigin: true, pathFilter: '/api/presence', on: { proxyRes: stripCors } }));
  http.use(createProxyMiddleware({ target: filesUrl, changeOrigin: true, pathFilter: '/api/files', on: { proxyRes: stripCors } }));

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[api-gateway] Running on http://localhost:${port}/api`);

  await registerInConsul('api-gateway', Number(port));
}
bootstrap();
