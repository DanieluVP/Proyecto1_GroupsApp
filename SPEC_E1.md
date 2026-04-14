# SPEC E1 — Monolito Funcional GroupsApp
## Fecha límite: 8 de marzo | Peso: 20%

---

## OBJETIVO

Construir una aplicación monolítica completamente funcional que corra en un **único servidor en AWS EC2**. Todo el stack en un solo proceso NestJS con Next.js separado como frontend, ambos orquestados con Docker Compose.

---

## FASE 1 — Setup inicial del proyecto

### 1.1 Estructura raíz
Crear el monorepo con esta estructura:
```
groupsapp/
├── CLAUDE.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
└── frontend/
```

### 1.2 docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: groupsapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file: ./backend/.env
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    env_file: ./frontend/.env.local
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## FASE 2 — Backend NestJS

### 2.1 Inicializar proyecto
```bash
cd groupsapp
npx @nestjs/cli new backend --package-manager npm --language TypeScript
```

### 2.2 Instalar dependencias
```bash
cd backend
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/typeorm
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install passport passport-jwt bcrypt typeorm pg
npm install class-validator class-transformer
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install socket.io multer
npm install --save-dev @types/bcrypt @types/passport-jwt @types/multer
```

### 2.3 Módulos a implementar (en este orden)

#### 2.3.1 UsersModule
- `User` entity: `id (uuid)`, `username (unique)`, `email (unique)`, `password`, `avatarUrl?`, `createdAt`
- `UsersService`: `create()`, `findByEmail()`, `findByUsername()`, `findById()`, `searchByUsername()`
- `UsersController`: `GET /users/search?q=`, `GET /users/:id`

#### 2.3.2 AuthModule
- `POST /api/auth/register` → valida DTO, hashea password, devuelve JWT
- `POST /api/auth/login` → valida credenciales, devuelve JWT
- `JwtStrategy` + `JwtAuthGuard`
- JWT payload: `{ sub: userId, email, username }`

#### 2.3.3 GroupsModule
- `Group` entity: `id (uuid)`, `name`, `description?`, `adminId (FK User)`, `createdAt`
- `GroupMember` entity: `groupId`, `userId`, `role (admin|member)`, `joinedAt`
- `GroupsService`: `create()`, `findById()`, `findUserGroups()`, `addMember()`, `removeMember()`, `isMember()`
- `GroupsController`:
  - `POST /api/groups` → crear grupo (quien crea es admin y primer miembro)
  - `GET /api/groups` → mis grupos
  - `GET /api/groups/:id` → detalles del grupo con miembros
  - `POST /api/groups/:id/members` → agregar miembro (solo admin)
  - `DELETE /api/groups/:id/members/:userId` → remover (solo admin)

#### 2.3.4 ChannelsModule
- `Channel` entity: `id (uuid)`, `groupId (FK Group)`, `name`, `description?`, `createdAt`
- `ChannelsService`: `create()`, `findByGroup()`, `findById()`
- `ChannelsController`:
  - `POST /api/groups/:groupId/channels`
  - `GET /api/groups/:groupId/channels`

#### 2.3.5 MessagesModule
- `Message` entity: `id (uuid)`, `content`, `senderId (FK User)`, `targetId`, `targetType (group|channel|dm)`, `fileUrl?`, `createdAt`
- `MessageRead` entity: `messageId`, `userId`, `readAt`
- `MessagesService`:
  - `create(content, senderId, targetId, targetType, fileUrl?)`: guarda en DB
  - `findByTarget(targetId, targetType, limit, offset)`: historial paginado
  - `markAsRead(messageId, userId)`: crea o actualiza MessageRead
  - `getReadReceipts(messageId)`: quién leyó el mensaje
- `MessagesController`:
  - `GET /api/messages/:targetId?type=group|channel|dm&limit=50&offset=0`
  - `POST /api/messages/:targetId/read` → marcar como leído

#### 2.3.6 PresenceModule
- `PresenceService`:
  - `setOnline(userId, socketId)`: guarda en Map en memoria
  - `setOffline(userId)`: remueve del Map
  - `getOnlineUsers()`: lista de userIds online
  - `isOnline(userId)`: boolean
- `PresenceGateway`:
  - En `handleConnection`: extrae userId del JWT, llama `setOnline()`, emite `presence:update` a todos
  - En `handleDisconnect`: llama `setOffline()`, emite `presence:update` a todos

#### 2.3.7 ChatModule
- `ChatGateway` (gateway principal de mensajería):
  - `handleConnection(client)`: verifica JWT del handshake, registra socketId → userId
  - `handleDisconnect(client)`: limpieza
  - `@SubscribeMessage('join:group')`: `client.join(groupId)`
  - `@SubscribeMessage('leave:group')`: `client.leave(groupId)`
  - `@SubscribeMessage('join:channel')`: `client.join(channelId)`
  - `@SubscribeMessage('send:message')`: valida membresía → llama MessagesService.create() → emite `message:new` al room
  - `@SubscribeMessage('typing:start')`: emite `typing:update` al room
  - `@SubscribeMessage('typing:stop')`: emite `typing:update` al room
  - `@SubscribeMessage('read:messages')`: llama MessagesService.markAsRead() → emite `message:read`

#### 2.3.8 FilesModule
- `FilesService`:
  - `uploadToS3(file: Express.Multer.File)`: sube a S3, devuelve URL pública
- `FilesController`:
  - `POST /api/files/upload` (multipart/form-data) → devuelve `{ url }`
- Usar `@aws-sdk/client-s3` con `PutObjectCommand`
- Limitar tamaño de archivo a 10MB, tipos: image/*, video/*, application/pdf

---

## FASE 3 — Frontend Next.js

### 3.1 Inicializar proyecto
```bash
cd groupsapp
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 3.2 Instalar dependencias
```bash
cd frontend
npm install axios socket.io-client zustand
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install @tanstack/react-query
```

### 3.3 Páginas y componentes a implementar

#### Autenticación
- `/login` → formulario email + password → POST /api/auth/login → guarda JWT en localStorage → redirect a /groups
- `/register` → formulario username + email + password → POST /api/auth/register → redirect a /login

#### Layout principal (`/groups` en adelante)
- Sidebar izquierdo: lista de grupos con indicador de mensajes no leídos
- Panel central: chat activo
- Header: nombre del grupo/canal + lista de miembros online

#### Vistas del chat
- `/groups` → lista de grupos, botón crear grupo
- `/groups/[groupId]` → chat del grupo (canal general)
- `/groups/[groupId]/[channelId]` → canal específico
- `/dm/[userId]` → mensajes directos

#### Componentes críticos
- `MessageBubble`: muestra mensaje, sender, timestamp, fileUrl si existe, + ReadReceipt (chulitos)
- `MessageList`: renderiza lista con scroll automático al último mensaje
- `MessageInput`: textarea + botón enviar + botón adjuntar archivo + indicador de typing
- `ReadReceipt`: ✓ (enviado), ✓✓ (entregado), ✓✓ azul (leído)
- `OnlineIndicator`: punto verde/gris junto al avatar
- `FileUpload`: drag & drop o click → POST /api/files/upload → devuelve URL para adjuntar al mensaje

#### Hooks críticos
```typescript
// useSocket.ts — singleton connection con JWT en handshake
// useMessages.ts — carga historial + escucha message:new en tiempo real
// usePresence.ts — escucha presence:update, mantiene Map de usuarios online
// useAuth.ts — estado de sesión, login, logout, refresh
```

#### Stores Zustand
```typescript
// authStore: { user, token, setAuth, logout }
// chatStore: { messages por targetId, addMessage, markRead }
// presenceStore: { onlineUsers Set, setOnline, setOffline }
```

---

## FASE 4 — Docker y despliegue EC2

### 4.1 Dockerfile backend
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/main"]
```

### 4.2 Dockerfile frontend
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

### 4.3 Pasos de despliegue EC2
1. Crear instancia EC2 t3.medium con Ubuntu 22.04
2. Instalar Docker + Docker Compose
3. Clonar repositorio
4. Configurar `.env` con credenciales reales (S3, JWT secret)
5. `docker-compose up -d --build`
6. Configurar Security Group: abrir puertos 3000, 3001, 80

---

## CHECKLIST ENTREGA 1

- [ ] Registro y login funcionando con JWT
- [ ] CRUD de grupos (crear, listar, ver, agregar/remover miembros)
- [ ] CRUD de canales dentro de grupos
- [ ] Chat en tiempo real en grupos (WebSocket)
- [ ] Chat en tiempo real en canales (WebSocket)
- [ ] Mensajes directos (DM)
- [ ] Historial de mensajes con paginación
- [ ] Estado de presencia online/offline visible en UI
- [ ] Read receipts (mensajes marcados como leídos, chulitos en UI)
- [ ] Upload de archivos/imágenes a S3
- [ ] Visualización de imágenes en el chat
- [ ] App corriendo en EC2 con Docker Compose
- [ ] README con instrucciones de setup y URL de la app
- [ ] Video demo de 10-15 minutos

---

## NOTAS PARA CLAUDE CODE

- **Empieza siempre por el backend** — construye y verifica cada módulo antes de pasar al siguiente
- **Orden de módulos:** Users → Auth → Groups → Channels → Messages → Presence → Chat → Files
- **Después de cada módulo**, verifica que compila: `npm run build`
- **TypeORM synchronize** en `true` para E1 (facilita desarrollo), cambiar a migraciones en E3
- **El gateway de chat** debe validar que el usuario es miembro del grupo antes de permitir enviar mensajes
- **Para los tests manuales**, usa el archivo `test-api.http` que debes crear con los endpoints principales
- **Si hay error de CORS**, verificar que `FRONTEND_URL` está en el `.env` del backend
- Al terminar cada fase, **hacer commit** con mensaje descriptivo
