require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
async function main() {
    console.log('Connecting to', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('Connected!');
    const users = await prisma.user.findMany();
    console.log('Users:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
