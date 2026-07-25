const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Cambo <noreply@camboapp.com>';

export async function sendPasswordResetEmail(to, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: 'Reset your Cambo password',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
          <p>Someone requested a password reset for your Cambo account.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #111208; color: #d7ff3f; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset your password
            </a>
          </p>
          <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
}
