FROM node:20-alpine AS builder
WORKDIR /app
COPY services/messaging-service/package*.json ./
RUN npm ci
COPY services/messaging-service/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY services/messaging-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto/ /proto/
ENV NODE_ENV=production
EXPOSE 3003
CMD ["node", "dist/main.js"]
