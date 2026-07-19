import { getDatabase } from '@netlify/database';
import { requireUser } from '../lib/auth.js';
import { CAPTURE_CAP, capturesUsedThisPeriod, hasAccess, isInOverage } from '../lib/access.js';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (request) => {
  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) return jsonResponse(401, { error: 'Not signed in.' });

  const capturesUsed = await capturesUsedThisPeriod(db, user.id, user.current_period_start);

  return jsonResponse(200, {
    id: user.id,
    email: user.email,
    role: user.role,
    trial_ends_at: user.trial_ends_at,
    subscription_status: user.subscription_status,
    has_access: hasAccess(user),
    captures_used: capturesUsed,
    captures_cap: CAPTURE_CAP,
    in_overage: isInOverage(user, capturesUsed),
  });
};
