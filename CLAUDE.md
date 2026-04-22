# GroupsApp — Sistema de Mensajería Distribuida
## Materia: ST0263 Tópicos Especiales en Telemática / SI3007 Sistemas Distribuidos, 2026-1

---

## 🎯 CONTEXTO DEL PROYECTO

Aplicación de mensajería instantánea similar a WhatsApp/Telegram con arquitectura de microservicios desplegada en AWS EKS. El fuerte son los **grupos**, no las comunicaciones 1-1. Cada grupo tiene un `groupId` único y puede tener canales con su propio `channelId`.

**Entrega actual: E3 — Aplicación distribuida escalable en EKS**

---

## 🏗️ ARQUITECTURA DE MICROSERVICIOS

```
groupsapp/
├── services/
│   ├── api-gateway/        ← HTTP proxy + JWT validation via gRPC (port 3000)
│   ├── auth-service/       ← Auth + Users, gRPC server (HTTP:3001, gRPC:5001)
│   ├── groups-service/     ← Groups + Channels, gRPC server (HTTP:3002, gRPC:5002)
│   ├── messaging-service/  ← Messages + WebSocket chat (port 3003)
│   ├── presence-service/   ← Online/offline + WebSocket (port 3004)
│   └── files-service/      ← S3 upload (port 3005)
├── frontend/               ← Next.js App Router (port 3001 local)
├── proto/                  ← Protobuf definitions (auth.proto, groups.proto)
├── k8s/base/               ← Kubernetes manifests (EKS)
└── docker-compose.yml      ← Local dev stack
```

---

## 🛠️ STACK TECNOLÓGICO

### Backend (cada microservicio)
- **Framework:** NestJS 11 + TypeScript
- **Base de datos:** PostgreSQL + TypeORM (DB separada por servicio)
- **Auth:** JWT + Passport (passport-jwt)
- **WebSockets:** @nestjs/websockets + Socket.IO
- **gRPC:** @nestjs/microservices + @grpc/grpc-js
- **Kafka:** kafkajs (producer en messaging/groups, consumer en presence)
- **Redis:** ioredis (presencia multi-réplica en presence-service)
- **Service discovery:** Consul

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **UI:** React 19 + TypeScript
- **Estilos:** Tailwind CSS
- **Estado global:** Zustand
- **WebSocket client:** Socket.IO client
- **HTTP client:** axios

### Infraestructura (E3)
- Docker + Docker Compose (desarrollo local)
- AWS EKS (producción)
- AWS S3 (archivos e imágenes)
- Kafka + Zookeeper (eventos asíncronos)
- Redis (estado de presencia distribuido)
- Consul (service discovery + health checks)

---

## 🔌 COMUNICACIONES

### REST (externo via api-gateway)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/:id
GET    /api/users/search?q=username
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:uid
POST   /api/groups/:groupId/channels
GET    /api/groups/:groupId/channels
GET    /api/messages/:targetId?type=group|channel|dm&limit=50&offset=0
POST   /api/messages/:targetId/read
POST   /api/files/upload
```

### gRPC (interno)
- `api-gateway → auth-service`: `ValidateToken`, `GetUser`
- `messaging-service → groups-service`: `IsMember`, `GetGroupMembers`

### Kafka (eventos asíncronos)
- `messaging-service` publica: `message.sent`
- `groups-service` publica: `member.joined`, `member.removed`
- `presence-service` consume: `message.sent`, `member.joined`, `member.removed`

### WebSocket (Socket.IO)
**Cliente → Servidor:**
```
join:group     { groupId }
leave:group    { groupId }
join:channel   { channelId }
leave:channel  { channelId }
join:dm        { userId }
send:message   { targetId, targetType: 'group'|'channel'|'dm', content, fileUrl? }
typing:start   { targetId, targetType }
typing:stop    { targetId, targetType }
read:messages  { targetId, targetType }
```
**Servidor → Cliente:**
```
message:new       { message }
message:read      { targetId, readBy, readAt }
presence:update   { userId, status: 'online'|'offline' }
typing:update     { userId, targetId, isTyping }
```

---

## 🗄️ MODELO DE DATOS

### groupsapp_auth (auth-service)
```
User: id(uuid), username, email, password(bcrypt), avatarUrl, createdAt
```

### groupsapp_groups (groups-service)
```
Group: id(uuid), name, description, adminId(string), createdAt
GroupMember: groupId, userId(string), role('admin'|'member'), joinedAt
Channel: id(uuid), groupId, name, description, createdAt
```

### groupsapp_messaging (messaging-service)
```
Message: id(uuid), content, senderId, senderUsername, targetId, targetType, fileUrl, createdAt
MessageRead: messageId, userId, readAt
```

---

## ⚙️ VARIABLES DE ENTORNO POR SERVICIO

### api-gateway
```env
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
GROUPS_SERVICE_URL=http://groups-service:3002
MESSAGING_SERVICE_URL=http://messaging-service:3003
PRESENCE_SERVICE_URL=http://presence-service:3004
FILES_SERVICE_URL=http://files-service:3005
AUTH_SERVICE_GRPC=auth-service:5001
FRONTEND_URL=http://localhost:3001
CONSUL_HOST=consul
```

### auth-service
```env
PORT=3001
GRPC_PORT=5001
DB_HOST=postgres
DB_NAME=groupsapp_auth
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=change-in-production
JWT_EXPIRES_IN=7d
CONSUL_HOST=consul
```

### groups-service
```env
PORT=3002
GRPC_PORT=5002
DB_HOST=postgres
DB_NAME=groupsapp_groups
JWT_SECRET=change-in-production
KAFKA_BROKERS=kafka:9092
CONSUL_HOST=consul
```

### messaging-service
```env
PORT=3003
DB_HOST=postgres
DB_NAME=groupsapp_messaging
JWT_SECRET=change-in-production
KAFKA_BROKERS=kafka:9092
GROUPS_SERVICE_GRPC=groups-service:5002
CONSUL_HOST=consul
```

### presence-service
```env
PORT=3004
JWT_SECRET=change-in-production
KAFKA_BROKERS=kafka:9092
REDIS_HOST=redis
REDIS_PORT=6379
CONSUL_HOST=consul
```

### files-service
```env
PORT=3005
JWT_SECRET=change-in-production
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=groupsapp-files
CONSUL_HOST=consul
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

---

## 🐳 COMANDOS CLAVE

```bash
# Desarrollo local (levantar toda la infraestructura)
docker-compose up --build

# Build de un servicio individual
cd services/<servicio> && npm run build

# Deploy en EKS
kubectl apply -k k8s/base/

# Verificar pods
kubectl get pods -n groupsapp

# Ver logs de un servicio
kubectl logs -n groupsapp deployment/<servicio> -f
```

---

## 📐 CONVENCIONES DE CÓDIGO

### NestJS / Microservicios
- Cada microservicio es independiente: su propia DB, su propio `package.json`
- No hay relaciones TypeORM entre servicios — solo foreign keys como `string`
- gRPC controllers con `@GrpcMethod` en archivos `*.grpc.controller.ts`
- Kafka producers/consumers con degradación elegante (si Kafka no está disponible, no falla)
- `OnModuleInit` para inicializar clientes gRPC (nunca en el constructor)
- Todos los servicios tienen `/api/health` endpoint para readiness/liveness probes

### Next.js / Frontend
- App Router únicamente — no Pages Router
- `'use client'` solo cuando se necesita interactividad
- Zustand stores en `/store/` — un store por dominio
- Socket.IO como singleton en `/lib/socket.ts`
- Tailwind para todos los estilos

---

## ⚠️ REGLAS IMPORTANTES

1. **No usar `synchronize: true` en producción** — siempre migraciones
2. **No guardar passwords en texto plano** — siempre bcrypt
3. **Los gRPC clients se inicializan en `onModuleInit()`**, nunca en el constructor
4. **Kafka y Redis tienen fallback graceful** — si no están disponibles, el servicio sigue funcionando
5. **El api-gateway valida JWT via gRPC** — los servicios downstream confían en los headers `x-user-id`, `x-user-email`, `x-user-username`
6. **S3 para archivos** — nunca guardar archivos en el servidor local
7. **TypeScript strict** — no usar `any` sin justificación
8. **Variables de entorno** — nunca hardcodear secrets en el código
