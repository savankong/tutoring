// One-off: sends the real sendWelcomeEmail() template to a test address, so
// you can see exactly what a new signup receives without creating a real
// account. Not part of the running app — a throwaway dev tool, run from
// wherever RESEND_API_KEY is set (e.g. the DO Console for the web
// component, same place scripts/migrate-db.mjs gets run from).
//
// Usage:
//   RESEND_API_KEY=re_... node scripts/send-test-welcome-email.mjs [email] [google|password|both]
//
// Defaults to savankong@gmail.com and sending both signup-method variants
// (two separate emails) so they're easy to compare side by side.

import { sendWelcomeEmail } from '../netlify/lib/email.js';

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is required.');
    process.exit(1);
  }

  const to = process.argv[2] || 'savankong@gmail.com';
  const variant = process.argv[3] || 'both';
  const methods = variant === 'both' ? ['password', 'google'] : [variant];

  for (const method of methods) {
    console.log(`Sending "${method}" variant to ${to}...`);
    await sendWelcomeEmail(to, method);
    console.log(`Sent.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
