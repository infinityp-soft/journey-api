/**
 * Roll back the most recently applied Prisma migration (DOWN step).
 *
 * Prisma Migrate is forward-only by design. We follow the common best-practice
 * pattern of pairing each migration folder with a hand-written `down.sql`, then:
 *   1. Run that SQL against the database
 *   2. Delete the corresponding row from `_prisma_migrations`
 *
 * Usage: npm run migrate:down
 *        npm run migrate:down -- --steps=2   (roll back N migrations)
 */
import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

dotenv.config();

interface AppliedMigration {
  id: string;
  migration_name: string;
  finished_at: Date | null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const stepsArg = process.argv.find((a) => a.startsWith('--steps='));
  const steps = Math.max(1, parseInt(stepsArg?.split('=')[1] ?? '1', 10));

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query<AppliedMigration>(
      `SELECT id, migration_name, finished_at
         FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
          AND rolled_back_at IS NULL
        ORDER BY finished_at DESC
        LIMIT $1`,
      [steps],
    );

    if (rows.length === 0) {
      console.log('No applied migrations to roll back.');
      return;
    }

    for (const row of rows) {
      const folder = join(
        process.cwd(),
        'prisma',
        'migrations',
        row.migration_name,
      );
      const downPath = join(folder, 'down.sql');

      if (!existsSync(downPath)) {
        throw new Error(
          `Missing down.sql for migration "${row.migration_name}".\n` +
            `Expected at: ${downPath}`,
        );
      }

      const sql = readFileSync(downPath, 'utf8');
      console.log(`→ migrate:down  rolling back ${row.migration_name}…`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `DELETE FROM "_prisma_migrations" WHERE id = $1`,
          [row.id],
        );
        await client.query('COMMIT');
        console.log(`✓ migrate:down  ${row.migration_name} rolled back`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('migrate:down failed:', err);
  process.exit(1);
});
