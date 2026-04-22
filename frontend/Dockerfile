FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars must be available at BUILD time (they are inlined by Next.js).
# Pass them with --build-arg when building the image, e.g.:
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=http://<INGRESS_HOST> \
#     --build-arg NEXT_PUBLIC_WS_URL=http://<INGRESS_HOST> \
#     -t <ECR_REPO>/frontend:latest .
#
# Defaults work for local development (api-gateway on localhost:3000).
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_WS_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "run", "start"]
