FROM node:20-alpine AS builder
WORKDIR /app
COPY services/presence-service/package*.json ./
RUN npm ci
COPY services/presence-service/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY services/presence-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3004
CMD ["node", "dist/main.js"]
