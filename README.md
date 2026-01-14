# DepanceAPP

![License](https://img.shields.io/github/license/mehdimp4/DepanceAPP?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/mehdimp4/DepanceAPP?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/mehdimp4/DepanceAPP?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**DepanceAPP** is a powerful, open-source, self-hosted Personal Finance Management (PFM) application. Built with privacy and performance in mind, it allows you to take full control of your financial data without relying on third-party cloud services.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=Dashboard+Preview+Coming+Soon)

---

## ✨ Key Features

- **📊 Comprehensive Dashboard:** Get a real-time overview of your net worth, recent activity, and budget status.
- **💰 Account Management:** Track unlimited accounts (Bank, Cash, Savings) with multi-currency support.
- **💸 Transaction Tracking:** Easily log income and expenses with smart categorization and custom tags.
- **📈 Budgeting:** Set monthly limits for specific categories and track your spending progress visually.
- **🔄 Recurring Transactions:** Automate your fixed expenses (rent, subscriptions) and income (salary).
- **🔒 Privacy First:** Your data lives on your server. No external tracking, no data selling.
- **🛡️ Enterprise-Grade Security:**
  - Secure Authentication (JWT + Refresh Tokens)
  - Account Lockout protection against brute-force attacks
  - Detailed Login History & Audit Logs

---

## 🚀 Getting Started

You can run DepanceAPP in minutes using Docker.

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.
- A **MySQL** or **MariaDB** database (can be hosted on the same server or separately).

### Quick Start (Production)

1.  **Create a `docker-compose.yml` file:**

    ```yaml
    version: '3.8'

    services:
      app:
        image: ghcr.io/mehdimp4/depanceapp:latest
        container_name: depance-app
        ports:
          - "3000:3000"
        environment:
          # Database Configuration (REQUIRED)
          - DB_HOST=db
          - DB_PORT=3306
          - DB_USER=depance
          - DB_PASSWORD=secure_password
          - DB_NAME=depance_db
          
          # Application URL (REQUIRED for CORS)
          - APP_URL=https://your-domain.com
          
          # Security (REQUIRED)
          - JWT_SECRET=change_this_to_a_long_random_string
        depends_on:
          - db
        restart: always

      db:
        image: mariadb:10.6
        container_name: depance-db
        environment:
          - MYSQL_ROOT_PASSWORD=root_secure_password
          - MYSQL_DATABASE=depance_db
          - MYSQL_USER=depance
          - MYSQL_PASSWORD=secure_password
        volumes:
          - db_data:/var/lib/mysql
        restart: always

    volumes:
      db_data:
    ```

2.  **Run the application:**

    ```bash
    docker-compose up -d
    ```

3.  **Access the app:**
    Open your browser and navigate to `http://localhost:3000` (or your domain).

---

## ⚙️ Configuration

You can configure the application using environment variables.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_URL` | Public URL of your application (e.g., `https://finance.me`). Used for CORS. | `http://localhost:3000` | **Yes** |
| `DB_HOST` | Database hostname | `localhost` | **Yes** |
| `DB_PORT` | Database port | `3306` | No |
| `DB_USER` | Database user | `root` | **Yes** |
| `DB_PASSWORD`| Database password | `root` | **Yes** |
| `DB_NAME` | Database name | `depance_db` | No |
| `JWT_SECRET` | Secret key for signing tokens. Must be long and secure. | - | **Yes** |
| `LOG_LEVEL` | Logging level (`info`, `debug`, `error`) | `info` | No |

---

## 🛠️ Development (Contribution)

We welcome contributions! Here is how to run the project locally for development.

### Prerequisites
- Node.js v18+
- npm or pnpm
- A local MySQL connection

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/mehdimp4/DepanceAPP.git
    cd DepanceAPP
    ```

2.  **Install Dependencies**
    ```bash
    # Install server dependencies
    cd server
    npm install
    
    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Configure Environment**
    Copy `.env.example` to `.env` in both `server` and `client` directories and adjust the settings.

4.  **Run Development Servers**
    ```bash
    # Terminal 1: Start Backend
    cd server
    npm run dev
    
    # Terminal 2: Start Frontend
    cd client
    npm run dev
    ```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/mehdimp4">Mehdi</a>
</p>
