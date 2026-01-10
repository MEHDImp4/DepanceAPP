# DepanceAPP 🚀

**DepanceAPP** is an open-source, self-hostable Personal Finance Management (PFM) application designed to help you track accounts, transactions, budgets, and recurring expenses with a privacy-first approach.

## ✨ Features

- **Dashboard:** Overview of your financial health.
- **Transactions:** Track income and expenses with categories.
- **Accounts:** Manage multiple bank accounts and cash wallets.
- **Budgets:** Set monthly limits and track progress.
- **Recurring Transactions:** Automate regular bills and salary.
- **Privacy:** 100% self-hosted, your data never leaves your server.
- **Security:** Account lockouts, login history, and audit logs.

## 🛠️ Architecture

- **Backend:** Node.js (Express), Prisma ORM
- **Database:** SQLite (Local Dev) / MariaDB or MySQL (Production)
- **Frontend:** React (Vite) [Coming Soon in root/client]

---

## 💻 Local Development

For developers who want to contribute. The project requires running Backend and Frontend separately in development mode.

### Prerequisites
- Node.js (v18+)
- SQLite (for local DB)

### 1. Start Backend (API)
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3001
# API Docs: http://localhost:3001/api-docs
```

### 2. Start Frontend (Client)
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```
*Note: In development, the frontend proxies API calls to port 3001 automatically via Vite.*

---

## 🏠 Self-Hosting (Production)

Deploy DepanceAPP using a single Docker container, similar to SonarQube. You must provide your own MySQL/MariaDB database.

### Quick Start with Docker Compose

1.  **Create `docker-compose.yml`:**
    ```yaml
    version: '3.8'
    services:
      app:
        image: ghcr.io/mehdimp4/depanceapp:latest # (Or build locally: build: .)
        container_name: depance-app
        ports:
          - "8080:3000" # Map host port 8080 to container port 3000
        environment:
          - DATABASE_URL=mysql://user:pass@db-host:3306/depance_db
          - JWT_SECRET=change_me_to_something_secure
        restart: always
    ```

2.  **Start:**
    ```bash
    docker-compose up -d
    ```
    Access the application at `http://your-server:8080`.

3.  **Automatic Migrations:**
    The container automatically applies the latest database migrations on startup. No manual intervention required.

### ⚙️ Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `APP_PORT` | Port exposed by the internal container (use docker ports to map to host) | No | `3000` |
| `DATABASE_URL` | MySQL/MariaDB Connection String (`mysql://user:pass@host:3306/db`) | **Yes** | - |
| `JWT_SECRET` | Secret key for signing tokens | **Yes** | - |
| `CLIENT_URL` | Public URL of the app (used for CORS/Links) | No | `http://localhost:3000` |
| `BACKUP_ENCRYPTION_KEY` | Key for encrypting backups | No | - |


### Building Locally

```bash
git clone https://github.com/mehdimp4/DepanceAPP.git
cd DepanceAPP
cp .env.example .env
# Edit .env to set your DB connection
docker-compose up -d --build
```

### 🔒 Security Check

- **Login History:** Monitor `/auth/login-history` (via frontend or API) for suspicious activity.
- **Backups:** Use the included scripts in `server/scripts/` to create encrypted backups.
  ```bash
  # Encrypted backup
  ./server/scripts/backup.sh --encrypt
  ```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](LICENSE)
