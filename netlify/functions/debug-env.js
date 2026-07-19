export default async () => {
  const keys = ['JWT_SECRET', 'ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'APP_SESSION_SECRET'];
  const status = {};
  for (const key of keys) {
    status[key] = {
      process_env: typeof process.env[key] !== 'undefined' && process.env[key] !== '',
      netlify_env: typeof Netlify?.env?.get === 'function' ? !!Netlify.env.get(key) : 'no-netlify-global',
    };
  }
  return new Response(JSON.stringify(status, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
