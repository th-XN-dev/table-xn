// ============================================================
//  Analytics engine — sof hisoblash funksiyalari.
//  daily_reports massivlari ustida ishlaydi. Hech narsa saqlanmaydi.
// ============================================================

export const sum = (rows, key) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);
export const avg = (rows, key) => (rows.length ? sum(rows, key) / rows.length : 0);

export const diff = (curr, prev) => curr - prev;
export function percentDiff(curr, prev) {
  if (!prev) return curr ? 100 : 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

// ---------- Konversiyalar (%) ----------
export function leadQuality(rows) {
  const l = sum(rows, 'leads');
  return l ? (sum(rows, 'quality_leads') / l) * 100 : 0;
}
export function contractConversion(rows) {
  const v = sum(rows, 'bd_visited');
  return v ? (sum(rows, 'contracts') / v) * 100 : 0;
}
export function visitRate(rows) {
  const w = sum(rows, 'bd_written');
  return w ? (sum(rows, 'bd_visited') / w) * 100 : 0;
}
export function attendanceRate(rows) {
  // Taxminiy davomat — biznes formulasiga moslang.
  const students = sum(rows, 'students');
  const missed = sum(rows, 'missed_lessons');
  return students ? Math.max(0, 1 - missed / students) * 100 : 0;
}

// ---------- O'sish (students kunlik farqi) ----------
export function growthSeries(sortedRows) {
  return sortedRows.map((r, i) => ({
    date: r.report_date,
    students: r.students,
    growth: i === 0 ? 0 : r.students - sortedRows[i - 1].students,
  }));
}
export function averageGrowth(sortedRows) {
  const g = growthSeries(sortedRows).slice(1).map((x) => x.growth);
  return g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
}

// ---------- Harakatlanuvchi o'rtacha ----------
export function movingAverage(values, window = 7) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// ---------- Trend (chiziqli regressiya nishabligi) ----------
// >0 → o'sish, <0 → pasayish
export function trend(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xs = [...Array(n).keys()];
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (values[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den ? num / den : 0;
}
