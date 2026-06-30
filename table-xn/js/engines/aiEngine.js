// ============================================================
//  AI engine — AI-ga tayyor arxitektura.
//  HOZIR: rule-based statistik insight'lar (defitsit/balans tahlili bilan).
//  KELAJAK: buildSummary() chiqishini OpenAI/Claude ga yuborish mumkin.
// ============================================================

const n = (v) => Number(v) || 0;

/** Dashboard ma'lumotidan avtomatik insight'lar. */
export function generateInsights(dashboard) {
  const out = [];
  const push = (level, text) => out.push({ level, text });
  const c = dashboard.compare;
  const day = dashboard.day.totals;
  const prevDay = dashboard.yesterday.totals;

  // ---- DEFITSIT / BALANS tekshiruvi (kirim-chiqim umumiy songa mosmi?) ----
  if (dashboard.yesterday.count > 0 && dashboard.day.count > 0) {
    const inflow = n(day.contracts) + n(day.returned);
    const outflow = n(day.students_left);
    if (inflow + outflow > 0) {
      const expected = n(prevDay.students) + inflow - outflow;
      const mismatch = n(day.students) - expected;
      if (mismatch !== 0) {
        push(
          'danger',
          `Defitsit aniqlandi: kecha ${n(prevDay.students)} o'quvchi edi, bugun ${inflow} keldi va ` +
          `${outflow} ketdi — ${expected} bo'lishi kerak edi, lekin ${n(day.students)} ko'rsatilgan ` +
          `(farq: ${mismatch > 0 ? '+' : ''}${mismatch}).`
        );
      }
    }
  }

  // ---- Lidlar pasayishi / o'sishi ----
  if (c.leads.previous > 0) {
    const p = Math.round(c.leads.percent);
    if (p <= -15) push('danger', `Lidlar soni kechagiga nisbatan ${Math.abs(p)}% kamaydi.`);
    else if (p >= 25) push('success', `Lidlar soni ${p}% oshdi.`);
  }

  // ---- Shartnoma konversiyasi past ----
  const cc = dashboard.day.contractConversion;
  if (n(day.bd_visited) >= 3 && cc < 20)
    push('warning', `Shartnoma konversiyasi past (${cc.toFixed(0)}%) — kutilgan darajadan kam.`);

  // ---- O'quvchi yo'qotish ketma-ketligi ----
  const loss = consecutiveLossDays(dashboard.month.rows);
  if (loss >= 3) push('danger', `O'quvchi yo'qotish ${loss} kun ketma-ket oshmoqda.`);

  // ---- Oylik trend ----
  if (dashboard.month.trend < -0.5) push('warning', "Oylik o'quvchilar trendi pasaymoqda.");
  else if (dashboard.month.trend > 0.5) push('success', "Oylik o'quvchilar trendi barqaror o'smoqda.");

  // ---- Yetishmayotgan ma'lumot ----
  if (dashboard.day.count === 0) push('info', "Bugun uchun hisobot hali kiritilmagan.");

  return out;
}

function consecutiveLossDays(sortedRows) {
  let streak = 0;
  for (let i = sortedRows.length - 1; i > 0; i--) {
    if (sortedRows[i].students < sortedRows[i - 1].students) streak++;
    else break;
  }
  return streak;
}

/** Kelajakdagi LLM integratsiyasi uchun matn xulosa. */
export function buildSummary(dashboard, branchName = '') {
  const t = dashboard.day.totals;
  return [
    `Filial: ${branchName || '—'}.`,
    `Sana: ${dashboard.day.rows[0]?.report_date || 'bugun'}.`,
    `O'quvchilar: ${t.students}, Lidlar: ${t.leads} (sifatli: ${t.quality_leads}).`,
    `Shartnomalar: ${t.contracts}, Ketgan: ${t.students_left}, Qaytgan: ${t.returned}.`,
    `Lead sifati: ${dashboard.day.leadQuality.toFixed(1)}%, ` +
      `Shartnoma konversiyasi: ${dashboard.day.contractConversion.toFixed(1)}%.`,
    `Oylik trend: ${dashboard.month.trend > 0 ? "o'sish" : 'pasayish'}.`,
  ].join(' ');
}
