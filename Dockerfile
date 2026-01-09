# Unified Dockerfile for DepanceAPP
# Builds both Client and Server, runs them as a single service.

# --- Stage 1: Client Build ---
FROM node:20-alpine AS client-builder

WORKDIR /client

# Copy client dependencies and install
COPY client/package*.json ./
RUN npm ci

# Copy client source code
COPY client/ ./
# Build the client (Vite output goes to /client/dist)
RUN npm run build 


# --- Stage 2: Server Build ---
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy server dependencies and install
COPY server/package*.json ./
# Copy prisma schema early for generation
COPY server/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# Copy server source code
COPY server/src ./src
COPY server/.env.example ./.env


# --- Stage 3: Final Production Image ---
FROM node:20-alpine

WORKDIR /app

# Copy server node_modules and built resources from server-builder
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/prisma ./prisma
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./package.json

# Copy client build artifacts to the server's public folder
# The Express server is configured to serve static files from ../public relative to src
COPY --from=client-builder /client/dist ./public

# Environment variables setup
ENV NODE_ENV=production
ENV PORT=3000

# Expose the single port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"]
