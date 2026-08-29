import pg from 'pg';

// Replaces @netlify/database's getDatabase() now that the database lives on
// DO Managed PostgreSQL instead of Netlify-wrapped Neon. Every call site in
// netlify/functions/*.js was written against @netlify/database's `db.sql`
// tagged-template helper (interpolated values become bind params, result is
// the plain array of rows) — this reproduces that exact shape on top of
// node-postgres so none of those call sites need to change.
let pool;

// pg-connection-string now parses a `sslmode=require` query param (the
// format DO's own dashboard hands you) as an alias for `verify-full` and
// derives its own strict ssl config from it, which wins over the `ssl`
// object passed alongside `connectionString` below — so the explicit
// `rejectUnauthorized: false` never actually took effect and every
// connection failed with "self-signed certificate in certificate chain"
// (DO Managed PostgreSQL's cert chain isn't in Node's trust store).
// Stripping sslmode here leaves `ssl: { rejectUnauthorized: false }` as the
// only signal, restoring the "encrypt but don't verify the chain" behavior
// this always intended.
function stripSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    pool = new pg.Pool({
      connectionString: stripSslMode(connectionString),
      // DO Managed PostgreSQL's default cert chain isn't in Node's trust
      // store; require TLS but don't verify the chain, same trust level
      // Neon's connection string (`sslmode=require`) had by default.
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

function sql(strings, ...values) {
  const text = strings.reduce((acc, chunk, i) => acc + (i > 0 ? `$${i}` : '') + chunk, '');
  return getPool()
    .query(text, values)
    .then((result) => result.rows);
}

export function getDatabase() {
  return { sql };
}