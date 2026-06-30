// ============================================================
//  Sana yordamchilari (ISO YYYY-MM-DD bilan ishlaydi).
// ============================================================
export const toISO = (d) => new Date(d).toISOString().slice(0, 10);
export const today = () => toISO(new Date());

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Hafta dushanbadan boshlanadi
export function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = dushanba
  d.setDate(d.getDate() - day);
  return toISO(d);
}
export function endOfWeek(date) { return addDays(startOfWeek(date), 6); }

export function startOfMonth(date) {
  const d = new Date(date);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
export function endOfMonth(date) {
  const d = new Date(date);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function startOfYear(date) {
  return toISO(new Date(new Date(date).getFullYear(), 0, 1));
}
export function endOfYear(date) {
  return toISO(new Date(new Date(date).getFullYear(), 11, 31));
}

/** Ikki sana orasidagi barcha kunlar ( inclusive). */
export function rangeDays(from, to) {
  const out = [];
  let cur = from;
  while (cur <= to) { out.push(cur); cur = addDays(cur, 1); }
  return out;
}
