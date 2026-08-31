// One-time backfill: adds every existing user to the Resend Audience that
// netlify/lib/email.js's addContactToAudience() keeps new signups synced
// into going forward. Needed because that sync only fires at signup —
// anyone who created their account before RESEND_AUDIENCE_ID was set (or
// before this feature existed at all) isn't in the audience yet.
//
// SAFE BY DEFAULT: dry-run unless you pass --execute. Always run without
// --execute first and read the output before adding it.
//
// Usage:
//   DATABASE_URL=postgres://... \
//   RESEND_API_KEY=re_... \
//   RESEND_AUDIENCE_ID=aud_... \
//   node scripts/backfill-resend-audience.mjs [--execute]

import pg from 'pg';

const EXECUTE = process.argv.includes('--execute');

// Same DO Managed PostgreSQL SSL quirk documented in scripts/migrate-db.mjs.
function stripSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return url.toString();
}

async function addContact(apiKey, audienceId, email) {
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend (${res.status}): ${detail}`);
  }
}

async function main() {
  const { DATABASE_URL, RESEND_API_KEY, RESEND_AUDIENCE_ID } = process.env;
  if (!DATABASE_URL || !RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.error('DATABASE_URL, RESEND_API_KEY, and RESEND_AUDIENCE_ID are all required.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: stripSslMode(DATABASE_URL), ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(EXECUTE ? '*** LIVE RUN — adding every user to the Resend audience ***' : 'DRY RUN — no changes will be made (pass --execute to apply)');
  console.log('');

  try {
    const { rows } = await client.query('SELECT email FROM users ORDER BY id');
    console.log(`Found ${rows.length} user(s).\n`);

    let added = 0;
    let failed = 0;

    for (const { email } of rows) {
      console.log(`[${EXECUTE ? 'ADDING' : 'WOULD ADD'}] ${email}`);
      if (EXECUTE) {
        try {
          await addContact(RESEND_API_KEY, RESEND_AUDIENCE_ID, email);
          added++;
        } catch (err) {
          console.error(`[ERROR] ${email}: ${err.message}`);
          failed++;
        }
      } else {
        added++;
      }
    }

    console.log('');
    console.log(`${EXECUTE ? 'Added' : 'Would add'}: ${added}. Failed: ${failed}.`);
    if (!EXECUTE) {
      console.log('This was a dry run — re-run with --execute to actually apply these changes.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
