// Fires Plausible's server-side Events API (https://plausible.io/docs/events-api)
// for a completed Stripe purchase. Server-side from the webhook, not
// window.plausible() on a thank-you page, because: (1) a webhook fires
// exactly once per Stripe event (see the stripe_webhook_events idempotency
// guard in stripe-webhook.js) and can't be skipped or double-fired by a
// flaky client-side redirect or a page refresh, the way a thank-you-page
// approach could; (2) there's no separate "did we already fire this"
// client-side flag to maintain. The tradeoff: this call originates from
// Stripe's server hitting our webhook, not the buyer's browser, so there's
// no real visitor User-Agent/IP available — the User-Agent header is
// omitted rather than sent as Stripe's own UA, which would misrepresent the
// visit and risks Plausible's bot filtering. This only affects
// device/browser breakdowns for these events, not whether the conversion
// is counted.
//
// Best-effort / non-blocking, same pattern as every email send in
// netlify/lib/email.js: a Plausible outage must never fail the webhook
// response, which would make Stripe retry and reprocess everything else.
const PLAUSIBLE_EVENT_URL = 'https://plausible.io/api/event';
const PLAUSIBLE_DOMAIN = 'camboapp.com';

export async function firePlausibleEvent(name, path, props) {
  try {
    const body = {
      name,
      url: `https://${PLAUSIBLE_DOMAIN}${path}`,
      domain: PLAUSIBLE_DOMAIN,
    };
    if (props) body.props = props;
    const res = await fetch(PLAUSIBLE_EVENT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Plausible event "${name}" failed (${res.status}):`, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error(`Failed to fire Plausible event "${name}":`, err);
  }
}

// Maps our internal plan/pass keys (netlify/lib/plans.js) to the exact
// custom-event Goal names already created in the Plausible dashboard for
// camboapp.com — these must match case-for-case, since Plausible treats
// event names as opaque strings and a mismatch here would silently produce
// a conversion event that never shows up under any configured Goal.
export const PURCHASE_EVENT_NAMES = {
  starter: 'Purchase: Starter',
  personal: 'Purchase: Personal',
  pro: 'Purchase: Pro',
  cram_24h: 'Purchase: Cram Pass',
  prep_7d: 'Purchase: Prep Pass',
  unlimited_30d: 'Purchase: Unlimited Pass',
};

// Short labels for the generic catch-all "Purchase" event's `plan` property
// (see stripe-webhook.js) — same pattern already used for the "Form:
// Submission" goal's "path" property (one event name, broken down by a
// property value, viewed as its own tab in the goal's dashboard page). This
// is fired *alongside* the specific PURCHASE_EVENT_NAMES event above, not
// instead of it, so both a combined total and a per-tier breakdown exist.
// Requires "plan" to be added to Site Settings → Custom Properties in the
// Plausible dashboard (same one-time setup "path" already went through) —
// otherwise the property is accepted by the API but won't show up as a
// breakdown in the UI.
export const PURCHASE_PLAN_LABELS = {
  starter: 'Starter',
  personal: 'Personal',
  pro: 'Pro',
  cram_24h: 'Cram Pass',
  prep_7d: 'Prep Pass',
  unlimited_30d: 'Unlimited Pass',
};

export const PURCHASE_CATCHALL_EVENT_NAME = 'Purchase';
