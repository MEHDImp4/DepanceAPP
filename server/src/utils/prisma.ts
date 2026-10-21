import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    if (process.env.MYSQL_URL) {
        return process.env.MYSQL_URL;
    }
    if (process.env.MYSQL_PRIVATE_URL) {
        return process.env.MYSQL_PRIVATE_URL;
    }

    const dbUser = encodeURIComponent(process.env.DB_USER || process.env.MYSQLUSER || 'root');
    const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'root');
    const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
    const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || '3306';
    const dbName = encodeURIComponent(process.env.DB_NAME || process.env.MYSQLDATABASE || 'depance_db');

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
