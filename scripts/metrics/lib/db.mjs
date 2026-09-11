import pg from 'pg';

// Same DO Managed PostgreSQL SSL quirk documented in scripts/migrate-db.mjs
// and scripts/migrate-subscribers-to-new-pricing.mjs: pg-connection-string
// treats DO's own `sslmode=require` query param as `verify-full`, which wins
// over the explicit `ssl` option below unless stripped.
function stripSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

export async function connectDb() {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  const client = new pg.Client({ connectionString: stripSslMode(DATABASE_URL), ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}
