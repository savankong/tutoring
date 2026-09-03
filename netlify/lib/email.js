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

// Sent from forgot-password.js instead of silently no-op'ing when the
// account on file has no password_hash (signed up via Google). The HTTP
// response to the browser stays identical either way (see forgot-password.js)
// so this doesn't create an email-enumeration side channel — but the account
// owner, who's the only person who receives it, gets an actual path forward
// instead of a reset email that can never arrive.
export async function sendGoogleAccountResetAttemptEmail(to) {
  await sendEmail({
    to,
    subject: 'Your Cambo account uses Google Sign-In',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Someone (probably you) just requested a password reset for this email on Cambo.</p>
        <p>This account was created with Google Sign-In, so it doesn't have a password to reset — there's nothing to change here. Just continue with Google instead:</p>
        <p>${ctaButton('https://camboapp.com/api/google-oauth-start', 'Continue with Google')}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
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
//
// Styling matches the Cambo Brand Guide (Ink/Clay/Newsprint palette, zero
// border radius, hard offset shadow on the button instead of a soft drop
// shadow) — same tokens as the zine design system elsewhere in the app
// (see "Design system" in CLAUDE.md), just inlined since email clients
// don't read a stylesheet. Display/body fonts fall back to system fonts:
// email clients strip custom fonts unless hosted via @font-face, which
// isn't set up for transactional email.
export async function sendWelcomeEmail(to, signupMethod) {
  const personalizedLine =
    signupMethod === 'google'
      ? 'Signed in with Google — nothing else to set up.'
      : "Signed up with email — verify your inbox if you haven't already, then you're in.";

  await sendEmail({
    to,
    subject: 'Welcome to Cambo',
    html: `
      <div style="font-family: -apple-system, 'Archivo', sans-serif; max-width: 480px; margin: 0 auto; background: #F0ECE1; color: #141310; padding: 32px 28px; border: 1.5px solid #141310;">
        <p style="font-family: 'Bricolage Grotesque', -apple-system, sans-serif; font-weight: 800; font-size: 28px; line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 0 0 16px;">
          Welcome to Cambo.
        </p>
        <p style="font-size: 15px; line-height: 1.55; margin: 0 0 20px;">
          Point your camera at a question, get an answer in about ten seconds. That's the whole product.
        </p>
        <p style="font-size: 15px; line-height: 1.55; margin: 0 0 8px;">
          <strong>${personalizedLine}</strong>
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0 24px; border-collapse: separate;">
          <tr>
            <td style="background: #E9E3D3; border: 1.5px solid #141310; padding: 16px 18px;">
              <p style="font-family: Archivo, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 10px;">
                What's included — free
              </p>
              <p style="font-size: 15px; line-height: 1.7; margin: 0;">
                5 captures a month, no card required<br />
                Photo capture + AI answers<br />
                Answer history, saved automatically
              </p>
            </td>
          </tr>
        </table>
        <p>
          <a href="https://camboapp.com/app" style="display: inline-block; padding: 12px 22px; background: #141310; color: #d7ff3f; text-decoration: none; font-family: Archivo, sans-serif; font-weight: 700; box-shadow: 7px 7px 0 #CF5F33;">Open Cambo</a>
        </p>
        <p style="font-size: 14px; line-height: 1.55; color: #141310; margin: 28px 0 0;">
          Nobody grades you on how long it took. Upgrade any time from your account page if five a month isn't enough —
          <a href="https://camboapp.com/pricing" style="color: #141310;">plans start at $9.99/mo</a>.
        </p>
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
