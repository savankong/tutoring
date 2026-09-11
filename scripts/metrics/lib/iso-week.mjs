// Standard ISO-8601 week number (Monday-start, week 1 contains the year's
// first Thursday) — used to name data/metrics/<year>-W<week>.json so one
// file accumulates each night's data across a week.
export function isoWeekOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function weekFileName({ year, week }) {
  return `${year}-W${String(week).padStart(2, '0')}.json`;
}
