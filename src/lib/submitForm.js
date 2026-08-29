// Replaces Netlify Forms — posts to the /api/submit-form backend endpoint
// (netlify/functions/submit-form.js), which emails the fields via Resend.
export async function submitForm(formName, fields) {
  const res = await fetch('/api/submit-form', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ formName, ...fields }),
  });
  if (!res.ok) throw new Error('Could not submit the form. Please try again.');
}
