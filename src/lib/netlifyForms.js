// Netlify Forms expects a normal POST to "/" with the exact fields declared
// on the hidden form it detected at deploy time (see the hidden <form> pair
// in index.html) — no Netlify Function or API call involved, Netlify's own
// infrastructure captures it from this request.
export async function submitNetlifyForm(formName, fields) {
  const body = new URLSearchParams({ 'form-name': formName, ...fields }).toString();
  const res = await fetch('/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Could not submit the form. Please try again.');
}
