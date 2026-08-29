// Applies netlify/database/migrations/<timestamp>_<name>/migration.sql files
// against DATABASE_URL, in filename order, tracking what's already applied
// in a schema_migrations table. Netlify DB used to auto-apply these on
// deploy; DO Managed PostgreSQL doesn't, so this replaces that step — run it
// manually before the first deploy and after adding new migrations.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../netlify/database/migrations', import.meta.url));

// See the matching comment in netlify/lib/db.js: pg-connection-string treats
// a `sslmode=require` query param (DO's own dashboard connection-string
// format) as an alias for `verify-full` and that wins over the explicit
// `ssl` option below, so it must be stripped for `rejectUnauthorized: false`
// to actually apply — otherwise this fails with "self-signed certificate in
// certificate chain" against DO Managed PostgreSQL's cert chain.
function stripSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: stripSslMode(connectionString), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows: appliedRows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(appliedRows.map((r) => r.name));

    const migrationDirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const name of migrationDirs) {
      if (applied.has(name)) {
        console.log(`skip  ${name} (already applied)`);
        continue;
      }

      const sqlPath = path.join(MIGRATIONS_DIR, name, 'migration.sql');
      const sql = readFileSync(sqlPath, 'utf8');

      console.log(`apply ${name}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${name} failed: ${err.message}`);
      }
    }

    console.log('Migrations up to date.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
