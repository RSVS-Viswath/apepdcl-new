export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key) {
  if (!key) return new Date(NaN);
  const d = new Date(`${key}T00:00:00`);
  return d;
}

export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function lastNDaysKeys(n, endDate = new Date()) {
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(toDateKey(addDays(end, -i)));
  }
  return keys;
}

export function defaultOverviewRange() {
  const end = new Date();
  const start = addDays(end, -6);
  return { startKey: toDateKey(start), endKey: toDateKey(end) };
}

