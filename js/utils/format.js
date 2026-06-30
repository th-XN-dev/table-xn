// ============================================================
//  Formatlash yordamchilari (UI uchun).
// ============================================================
export const fmtInt = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(Number(n) || 0));
export const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
export const fmtSigned = (n) => (n > 0 ? '+' : '') + fmtInt(n);
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
