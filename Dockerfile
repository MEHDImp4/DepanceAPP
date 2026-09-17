FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
COPY server/tsconfig*.json ./
COPY server/src ./src
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine

RUN apk --no-cache add bash openssl curl mariadb-client aws-cli \
    && addgroup -S depance \
    && adduser -S depance -G depance \
    && mkdir -p /app/backups \
    && chown -R depance:depance /app/backups

WORKDIR /app

COPY --chown=depance:depance --from=client-builder /app/client/dist ./public
COPY --chown=depance:depance --from=server-builder /app/server/node_modules ./node_modules
COPY --chown=depance:depance --from=server-builder /app/server/prisma ./prisma
COPY --chown=depance:depance --from=server-builder /app/server/dist ./dist
COPY --chown=depance:depance server/package*.json ./
COPY --chown=depance:depance server/scripts ./scripts
COPY --chown=depance:depance server/docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh scripts/*.sh

USER depance

ENV NODE_ENV=production
ENV PORT=3000
ENV BACKUP_DIR=/app/backups

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
