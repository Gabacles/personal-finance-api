
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  seed: 'ts-node prisma/seed.ts',
  migrations: {
    path: 'prisma/migrations',
  },
} as any);
