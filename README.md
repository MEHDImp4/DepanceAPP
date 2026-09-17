# DepanceAPP

![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**DepanceAPP** is an open-source, self-hosted personal finance manager built with React, Express, Prisma and MariaDB/MySQL.

![Dashboard Preview](https://github.com/user-attachments/assets/6a658dac-1b21-407f-893f-4fe3751737d1)

## Features

- Dashboard, monthly recap and spending trends
- Accounts, income, expenses and internal transfers
- Multi-currency accounts with normalized reporting
- Category budgets with weekly, monthly and yearly periods
- Recurring transactions and savings goals
- Responsive/PWA-oriented frontend
- Cookie-based JWT authentication with rotating refresh-token sessions
- Login history, security alerts and audit logs
- MariaDB/MySQL backups with optional AES encryption and S3 upload
- Docker deployment with database and backup persistence

## Production quick start

The repository already contains a production-oriented `docker-compose.yml` using **MariaDB 11.4**. Copy the example environment file, replace every placeholder secret/password, then start the stack:

```bash
cp .env.example .env
openssl rand -base64 48   # generate JWT_ACCESS_SECRET
openssl rand -base64 48   # generate a different JWT_REFRESH_SECRET
docker compose up -d
```

At minimum, set strong unique values for:

```env
DB_PASSWORD=...
DB_ROOT_PASSWORD=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
APP_URL=https://finance.example.com
ALLOWED_ORIGINS=https://finance.example.com
```

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are both required in production. The old single `JWT_SECRET` variable is supported only as a local-development fallback.

### Existing databases

Existing installations originally created with `prisma db push` must baseline the original migration once before switching to migration-based deployment:

```bash
npx prisma migrate resolve --applied 20260901193000_baseline
```

The production container runs `prisma migrate deploy` automatically at startup. Back up the database before upgrading an existing installation.

## Reverse proxy configuration

`TRUST_PROXY` defaults to `false`. Keep it disabled when port `3000` is directly reachable by clients.

If the app is behind a trusted reverse proxy, configure an exact hop count or trusted subnet, for example:

```env
TRUST_PROXY=1
```

Do not enable generic proxy trust unless the network topology actually guarantees that forwarded IP headers are sanitized by your proxy.

## Health endpoints

- `GET /health` — process liveness; does not depend on the database.
- `GET /ready` — readiness; returns success only when the application can query the database.

Docker Compose uses `/ready` for the application healthcheck.

## Backups

The Compose stack mounts `/app/backups` to the persistent `depance_backups` volume.

Create a normal backup:

```bash
docker exec depance-app ./scripts/backup.sh
```

Create an encrypted backup:

```bash
docker exec depance-app ./scripts/backup.sh --encrypt
```

Set `BACKUP_ENCRYPTION_KEY` before using encryption. To upload backups to S3, configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` and `AWS_REGION`, then run:

```bash
docker exec depance-app ./scripts/backup.sh --encrypt --s3
```

The production image includes the MariaDB client, OpenSSL and AWS CLI required by these scripts.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
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
| `BACKUP_DIR` | Backup path | `/app/backups` in Docker |
| `RETENTION_DAYS` | Local backup retention | `7` |

See `.env.example` for the full set of options.

## Development

Requirements: Node.js 20+, npm and Docker/MariaDB for production-parity integration tests.

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

### Validation

The GitHub Actions CI performs:

- Prisma client generation
- production migrations against MariaDB
- backend TypeScript checks
- dependency audits
- backend integration tests against MariaDB
- frontend tests and lint
- frontend and backend production builds
- Docker image build

Local commands:

```bash
cd server
npm run build:check
npm test

cd ../client
npm run test:run
npm run lint
npm run build
```

## Data model notes

- Monetary values are persisted as integers and exposed through the API in normal currency units.
- Internal transfer rows are excluded from spending/income analytics.
- Budgets and goals preserve the currency they were created in; changing the user's reporting currency does not relabel historical goal/budget amounts.
- Reporting periods use the user's stored IANA timezone. Existing users default to `UTC` until another timezone is selected.
- A category cannot switch between income/expense while it is referenced by financial data.
- Accounts participating in transfer history must have those transfers cancelled before the account can be deleted.

## Security notes

DepanceAPP includes short-lived access tokens, rotating hashed refresh tokens, refresh-token session families, rate limiting, login history, CSP headers and audit logging. Self-hosters are still responsible for TLS termination, host/container patching, secret management, database backups and network access controls.

## License

Distributed under the MIT License. See `LICENSE` for details.
