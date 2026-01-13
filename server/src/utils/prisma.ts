import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'depance_db';
    const dbSchema = process.env.DB_SCHEMA || 'public';

    // Default to postgresql as per schema.prisma
    return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=${dbSchema}`;
};

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});

export default prisma;
