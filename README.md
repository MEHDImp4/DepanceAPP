# DepanceAPP

DepanceAPP is a finance management application that helps you track your budget, expenses, and recurring transactions.

## Project Structure

- `client/`: Frontend application (React/Vite)
- `server/`: Backend API (Express/Node.js/Prisma)

## Getting Started

### Prerequisites

- Node.js
- MySQL (or compatible database)
- Prisma CLI

### Installation

1.  Clone the repository.
2.  Install dependencies for both client and server:
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

3.  Set up environment variables:
    - Create `.env` in `server/` based on your database configuration.

4.  Run Database Migrations:
    ```bash
    cd server
    npx prisma migrate dev
    ```

### Running the Application

To run both the client and server concurrently:

```bash
npm run dev
```

Or run them individually:

- **Server**: `npm run server` (runs on port 3000)
- **Client**: `npm run client` (runs on port 5173)

### Testing

Tests are located in the `server` directory.

```bash
cd server
npm test
```
