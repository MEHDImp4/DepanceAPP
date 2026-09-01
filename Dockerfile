# Stage 1: Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Build Server dependencies & Prisma
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
COPY server/tsconfig*.json ./
COPY server/src ./src
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Stage 3: Final Production Image
FROM node:20-alpine

# Install system dependencies (openssl for Prisma, curl for healthcheck)
RUN apk --no-cache add openssl curl
RUN addgroup -S depance && adduser -S depance -G depance

WORKDIR /app

# Copy Client Build
COPY --chown=depance:depance --from=client-builder /app/client/dist ./public

# Copy Server Dependencies and Prisma Client
COPY --chown=depance:depance --from=server-builder /app/server/node_modules ./node_modules
COPY --chown=depance:depance --from=server-builder /app/server/prisma ./prisma
COPY --chown=depance:depance --from=server-builder /app/server/dist ./dist
# Copy package.json for potentially npm scripts if needed, though running node directly
COPY --chown=depance:depance server/package*.json ./

# Copy Entrypoint
COPY server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER depance

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3000

# Expose the single port
EXPOSE 3000

# Start via entrypoint (handles migrations)
ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "dist/server.js"]
