import pg from 'pg';

// Replaces @netlify/database's getDatabase() now that the database lives on
// DO Managed PostgreSQL instead of Netlify-wrapped Neon. Every call site in
// netlify/functions/*.js was written against @netlify/database's `db.sql`
// tagged-template helper (interpolated values become bind params, result is
// the plain array of rows) — this reproduces that exact shape on top of
// node-postgres so none of those call sites need to change.
let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    pool = new pg.Pool({
      connectionString,
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
