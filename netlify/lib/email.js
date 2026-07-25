const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Cambo <noreply@camboapp.com>';

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
