const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Cambo <noreply@camboapp.com>';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ctaButton(url, label) {
  return `<a href="${url}" style="display: inline-block; padding: 10px 20px; background: #111208; color: #d7ff3f; text-decoration: none; border-radius: 8px; font-weight: 600;">${label}</a>`;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}

export async function sendPasswordResetEmail(to, resetUrl) {
  await sendEmail({
    to,
    subject: 'Reset your Cambo password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Someone requested a password reset for your Cambo account.</p>
        <p>${ctaButton(resetUrl, 'Reset your password')}</p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
  });
}

// Replaces Netlify Forms (build-time HTML crawler, no DO equivalent) — the
// "question" (homepage #ask) and "help" (Account page) forms both submit
// here via netlify/functions/submit-form.js and land in the same inbox
// Netlify's form-notification rule used to forward to.
export async function sendFormSubmission(formName, fields) {
  const rows = Object.entries(fields)
    .map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`)
    .join('');
  await sendEmail({
    to: 'camboapp101@gmail.com',
    subject: `New "${formName}" form submission — Cambo`,
    html: `<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">${rows}</div>`,
  });
}

export async function sendVerificationEmail(to, verifyUrl) {
  await sendEmail({
    to,
    subject: 'Verify your Cambo email',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Welcome to Cambo — verify your email to start using your captures.</p>
        <p>${ctaButton(verifyUrl, 'Verify your email')}</p>
        <p>This link expires in 24 hours. If you didn't create a Cambo account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// Fired once per genuinely new account (both signup paths — see
// register.js and the INSERT branch of google-oauth-callback.js), not on
// every subsequent login. Separate from sendVerificationEmail: email/
// password signups get both (this one isn't gated on verifying), Google
// signups only get this one since there's nothing to verify.
export async function sendWelcomeEmail(to) {
  await sendEmail({
    to,
    subject: 'Welcome to Cambo',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Welcome to Cambo — point your camera at a question, get an answer in seconds.</p>
        <p>${ctaButton('https://camboapp.com/app', 'Open Cambo')}</p>
        <p>Free plan gives you 5 captures a month, no card required. Upgrade any time from your account page if you need more.</p>
      </div>
    `,
  });
}

// Adds a user to the Resend Audience that update/announcement emails are
// sent to — that sending itself happens entirely in the Resend dashboard
// (Broadcasts), not in this codebase; this is just the "keep the audience
// in sync with signups" half. No-ops (doesn't throw) if RESEND_AUDIENCE_ID
// isn't set yet, so deploying this doesn't require the audience to exist
// first — see scripts/backfill-resend-audience.mjs for adding users who
// signed up before the audience was created.
export async function addContactToAudience(email) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return;

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend audience contact add failed (${res.status}): ${detail}`);
  }
}

// Internal heads-up, not user-facing — lands in the same inbox
// sendFormSubmission already uses for form notifications.
export async function sendAdminNewUserNotification(userEmail, source) {
  await sendEmail({
    to: 'camboapp101@gmail.com',
    subject: `New Cambo signup: ${userEmail}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p><strong>${escapeHtml(userEmail)}</strong> just signed up via ${escapeHtml(source)}.</p>
      </div>
    `,
  });
}
