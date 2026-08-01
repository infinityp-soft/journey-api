/**
 * Apply pending Prisma migrations (UP step).
 *
 * Prisma stores the forward SQL in each folder as `migration.sql`.
 * Companion rollbacks live alongside as `down.sql` (see migrate-down.ts).
 *
 * Usage: npm run migrate:up
 */
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

console.log('→ migrate:up  applying pending Prisma migrations…');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
console.log('✓ migrate:up  done');
