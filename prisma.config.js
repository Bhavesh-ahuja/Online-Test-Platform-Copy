// prisma.config.js
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
  // location of your Prisma schema file
  schema: path.join('backend', 'prisma', 'schema.prisma'),

  // where migrations live
  migrations: { path: path.join('backend', 'prisma', 'migrations') },

  // datasource must be configured here (migrate will read it)
  datasource: {
    url: env('DATABASE_URL'),
  },
});
