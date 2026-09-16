import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const dbUser = encodeURIComponent(process.env.DB_USER || 'root');
    const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || 'root');
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbName = encodeURIComponent(process.env.DB_NAME || 'depance_db');

    return `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});

export default prisma;
