# DepanceAPP

![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**DepanceAPP** is an open-source, self-hosted personal finance manager built with React, Express, Prisma and MariaDB/MySQL.

![Dashboard Preview](https://github.com/user-attachments/assets/6a658dac-1b21-407f-893f-4fe3751737d1)

## Features

- Dashboard, monthly recap and spending trends
- Accounts, income, expenses and concurrency-safe internal transfers
- Multi-currency accounts with backend-normalized and historically stable reporting
- Category budgets with weekly, monthly and yearly periods
- Timezone-aware recurring transactions and savings goals
- Responsive/PWA-oriented frontend
- Cookie-based JWT authentication with rotating refresh-token sessions
- Login history, security alerts and transactional audit logs
- Scheduled MariaDB/MySQL backups with checksum verification, AES encryption and optional S3 upload
- Docker deployment with persistent database and backup volumes

## Production quick start

Production uses **Node.js 22 LTS** and **MariaDB 11.4**. Copy the environment template and replace every placeholder secret/password before starting the stack:

```bash
cp .env.example .env
openssl rand -base64 48   # JWT_ACCESS_SECRET
openssl rand -base64 48   # different JWT_REFRESH_SECRET
openssl rand -base64 48   # BACKUP_ENCRYPTION_KEY
docker compose up -d
```

At minimum, set strong unique values for:

```env
DB_PASSWORD=...
DB_ROOT_PASSWORD=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
BACKUP_ENCRYPTION_KEY=...
APP_URL=https://finance.example.com
ALLOWED_ORIGINS=https://finance.example.com
```

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are both required in production. The old single `JWT_SECRET` variable is supported only as a local-development fallback.

### Pinning the production image

`latest` is only published after the full main CI succeeds. Every validated release is also published with its full commit SHA. For reproducible deployments, pin that immutable tag:

```env
DEPANCE_IMAGE=ghcr.io/mehdimp4/depanceapp:<validated-commit-sha>
```

Then run `docker compose pull && docker compose up -d`.

### Existing databases

Existing installations originally created with `prisma db push` must baseline the original migration once before switching to migration-based deployment:

```bash
npx prisma migrate resolve --applied 20260901193000_baseline
```

The production application container runs `prisma migrate deploy` automatically at startup. Always have a verified backup before upgrading an existing installation.

## Reverse proxy configuration

`TRUST_PROXY` defaults to `false`. Keep it disabled when port `3000` is directly reachable by clients. Behind a trusted reverse proxy, configure an exact hop count or trusted subnet, for example:

```env
TRUST_PROXY=1
```

Do not enable generic proxy trust unless forwarded IP headers are sanitized by your proxy.

## Health endpoints

- `GET /health` — process liveness, independent from the database.
- `GET /ready` — readiness, successful only when the database can be queried.

Docker Compose uses `/ready` for the application healthcheck.

## Automatic backups

Docker Compose includes a dedicated `backup` service. It creates one backup when the service starts and repeats on `BACKUP_INTERVAL_SECONDS` (24 hours by default). Scheduled backups fail closed when `BACKUP_ENCRYPTION_KEY` is missing unless `BACKUP_ALLOW_UNENCRYPTED=true` is explicitly configured.

Important variables:

```env
BACKUP_INTERVAL_SECONDS=86400
RETENTION_DAYS=7
BACKUP_ENCRYPTION_KEY=...
BACKUP_ALLOW_UNENCRYPTED=false
BACKUP_S3=false
```

Backups and their SHA-256 checksum files are stored in the persistent `depance_backups` volume. For an extra manual backup:

```bash
docker exec depance-backup /app/scripts/backup.sh --encrypt
```

To upload scheduled backups to S3, set `BACKUP_S3=true` and configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` and `AWS_REGION`.

### Restore

Restore verifies the matching `.sha256` file before touching the database:

```bash
docker exec -it depance-backup /app/scripts/restore.sh /app/backups/<backup>.sql.enc
```

`--yes` skips the interactive confirmation. `--skip-checksum` exists only for intentionally trusted legacy backups and should not be used for normal restores.

A backup is not operationally proven until a restore has been tested against a disposable MariaDB instance. Test restores periodically.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `DEPANCE_IMAGE` | Image/tag used by Compose | validated `latest` |
| `APP_PORT` | Published Docker port | `3000` |
| `APP_URL` | Public application URL | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | localhost URLs |
| `DB_HOST` | MariaDB/MySQL host | `db` in Compose |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `depance_db` |
| `DB_USER` | Database user | `depance` |
| `DB_PASSWORD` | Database password | change before production |
| `DB_ROOT_PASSWORD` | MariaDB root password | change before production |
| `DATABASE_URL` | Optional complete Prisma URL overriding `DB_*` | unset |
| `JWT_ACCESS_SECRET` | Access-token signing secret | required in production |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret | required in production |
| `TRUST_PROXY` | Express proxy trust policy | `false` |
| `ENABLE_API_DOCS` | Expose Swagger docs in production | `false` |
| `LOGIN_HISTORY_RETENTION_DAYS` | Login-history retention | `180` |
| `AUDIT_RETENTION_DAYS` | Audit-log retention | `365` |
| `BACKUP_INTERVAL_SECONDS` | Scheduled backup interval | `86400` |
| `RETENTION_DAYS` | Local backup retention | `7` |
| `BACKUP_ENCRYPTION_KEY` | AES backup encryption key | required by default |

See `.env.example` for the full set of options.

## Development

Requirements: Node.js 22+, npm and Docker/MariaDB for production-parity integration tests.

```bash
git clone https://github.com/MEHDImp4/DepanceAPP.git
cd DepanceAPP
cp .env.example .env

cd server
npm ci
npm run dev
```

In another terminal:

```bash
cd client
npm ci
npm run dev
```

## Validation

The main GitHub Actions CI performs:

- Prisma client generation
- production migrations against MariaDB 11.4
- backend TypeScript checks
- server and client dependency audits
- backend integration/regression tests against MariaDB
- frontend tests and lint
- frontend and backend production builds
- production Docker image build

The GHCR publish workflow runs only after this CI succeeds for a push to `main`/`master`. It publishes both `latest` and an immutable full-SHA tag.

Local commands:

```bash
cd server
npm run build:check
npm test

cd ../client
npm run test:run
npm run lint
npm run build

cd ..
docker build -t depanceapp-local .
```

## Data integrity notes

- Monetary values use a fixed 1/100 storage scale; currencies such as JPY reject fractional major-unit input.
- Internal transfer rows are excluded from spending/income analytics and must be cancelled as a pair.
- Accounts with financial history or recurring rules cannot be physically deleted.
- Historical cross-currency reporting uses per-transaction FX snapshots when available instead of silently repricing old activity with today's market rate.
- Budgets and goals preserve the currency they were created in; changing the user's reporting currency does not relabel historical values.
- Reporting periods and recurring wall-clock schedules use stored IANA timezones.
- A category cannot switch between income/expense while referenced by financial data.
- Idempotency keys are bound to request payloads and can be reused once their TTL has actually expired.

## Security notes

DepanceAPP includes short-lived access tokens, rotating hashed refresh tokens, refresh-token session families with replay detection, cross-tab refresh coordination, rate limiting, login history, CSP headers and transactional financial audit logging. Self-hosters remain responsible for TLS termination, host/container patching, secret management, backup key custody and network access controls.

Login history and audit logs have configurable retention windows so operational security data does not grow indefinitely.

## License

Distributed under the MIT License. See `LICENSE` for details.
