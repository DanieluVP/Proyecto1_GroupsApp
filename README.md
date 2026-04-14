# GroupsApp

Aplicación de mensajería instantánea distribuida similar a WhatsApp/Telegram. Enfocada en grupos con soporte de canales, mensajes directos, presencia online y archivos.

**Materia:** ST0263 Tópicos Especiales en Telemática / SI3007 Sistemas Distribuidos, 2026-1

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11 + TypeScript |
| Base de datos | PostgreSQL 16 + TypeORM |
| Auth | JWT + Passport |
| WebSockets | Socket.IO |
| Frontend | Next.js 14+ (App Router) |
| Estado | Zustand |
| Estilos | Tailwind CSS |
| Infra | Docker Compose + AWS EC2 + S3 |

---

## Setup rápido

### Opción 1 — Docker Compose (recomendado)

```bash
# 1. Copiar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 2. Editar backend/.env con tus credenciales AWS y JWT_SECRET

# 3. Levantar todo
docker-compose up --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001

### Opción 2 — Desarrollo local

```bash
# Terminal 1 — Base de datos
docker-compose up -d postgres

# Terminal 2 — Backend
cp backend/.env.example backend/.env
cd backend && npm install && npm run start:dev

# Terminal 3 — Frontend
cp frontend/.env.local.example frontend/.env.local
cd frontend && npm install && npm run dev
```

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` | Host PostgreSQL | localhost |
| `DB_PORT` | Puerto PostgreSQL | 5432 |
| `DB_USERNAME` | Usuario DB | postgres |
| `DB_PASSWORD` | Password DB | postgres |
| `DB_NAME` | Nombre DB | groupsapp |
| `JWT_SECRET` | Secreto para firmar tokens | — |
| `NODE_ENV` | Entorno | development |
| `PORT` | Puerto backend | 3000 |
| `AWS_ACCESS_KEY_ID` | Credencial AWS | — |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS | — |
| `AWS_REGION` | Región S3 | us-east-1 |
| `AWS_S3_BUCKET` | Bucket para archivos | groupsapp-files |
| `FRONTEND_URL` | URL frontend (CORS) | http://localhost:3001 |

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend REST | http://localhost:3000 |
| `NEXT_PUBLIC_WS_URL` | URL para WebSocket | http://localhost:3000 |

---

## Estructura del proyecto

```
groupsapp/
├── docker-compose.yml
├── backend/                  # NestJS API
│   └── src/
│       ├── auth/             # JWT + Passport
│       ├── users/            # Usuarios
│       ├── groups/           # Grupos y miembros
│       ├── channels/         # Canales dentro de grupos
│       ├── messages/         # Historial + read receipts
│       ├── presence/         # Online/offline
│       ├── files/            # Upload S3
│       └── chat/             # WebSocket gateway
└── frontend/                 # Next.js App Router
    └── src/
        ├── app/              # Páginas (login, groups, dm)
        ├── components/       # MessageBubble, GroupSidebar, etc.
        ├── hooks/            # useSocket, useMessages, usePresence
        ├── store/            # Zustand (auth, chat, presence)
        └── lib/              # axios wrapper, socket singleton
```

---

## API REST principal

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/users/:id
GET    /api/users/search?q=username

POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:userId

POST   /api/groups/:groupId/channels
GET    /api/groups/:groupId/channels

GET    /api/messages/:targetId?type=group|channel|dm&limit=50&offset=0
POST   /api/messages/:targetId/read

POST   /api/files/upload
```

---

## Entregas

| Entrega | Fecha | Descripción |
|---------|-------|-------------|
| E1 | 8 marzo | Monolito funcional en AWS EC2 |
| E2 | 29 marzo | Diseño arquitectónico + spec de comunicaciones |
| E3 | 26 abril | Aplicación distribuida en EKS |
