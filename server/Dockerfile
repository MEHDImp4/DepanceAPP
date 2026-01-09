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

# Install curl for healthchecks
RUN apk --no-cache add curl

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY src ./src
COPY .env .env

# Expose API port
EXPOSE 3001

# Start server
CMD ["node", "src/index.js"]
