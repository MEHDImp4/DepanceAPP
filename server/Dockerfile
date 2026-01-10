# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including dev (for prisma generate)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine

# Install curl for healthchecks and openssl for Prisma
RUN apk --no-cache add curl openssl

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY src ./src
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

# NOTE: Environment variables should be provided at runtime via docker-compose or K8s
# Do NOT copy .env files into the image - it exposes secrets if image is pushed to registry

# Expose API port
EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]

# Start server
CMD ["node", "src/index.js"]
