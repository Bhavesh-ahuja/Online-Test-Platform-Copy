// backend/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      // tell Prisma client the DB URL directly from the environment
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
