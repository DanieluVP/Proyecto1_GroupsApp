FROM node:20-alpine AS builder
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm ci
COPY services/auth-service/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY proto/ /proto/
ENV NODE_ENV=production
EXPOSE 3001
EXPOSE 5001
CMD ["node", "dist/main.js"]
