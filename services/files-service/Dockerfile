FROM node:20-alpine AS builder
WORKDIR /app
COPY services/files-service/package*.json ./
RUN npm ci
COPY services/files-service/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY services/files-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3005
CMD ["node", "dist/main.js"]
