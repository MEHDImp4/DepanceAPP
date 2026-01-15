"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || 'root';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbName = process.env.DB_NAME || 'depance_db';
    // MySQL connection string format
    return `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map