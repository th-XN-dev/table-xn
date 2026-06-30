// ============================================================
//  Sheets/Excel/CSV importi -> daily_reports
//  Sizning "Menejerlar kunlik hisobotlar" jadvalingizga moslangan:
//   - har sana ostida 2 qator (sonlar + foizlar) -> foiz qatori tashlanadi
//   - sana formati "DD,MM,YY"
//   - "-" yoki bo'sh -> 0
//   - call center ustunlari (subset) -> e'tiborga olinmaydi
// ============================================================
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

// Sarlavhani dastur maydoniga moslash
function mapHeader(h) {
  const s = String(h || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.includes('call center') || s.includes('cal center')) return null; // subset -> skip
  if (s.includes('sana')) return 'report_date';
  if (s.includes("o'quvchi") || s.includes('quvchilar') || s.includes('oquvchi')) return 'students';
  if (s.includes('sifatli')) return 'quality_leads';
  if (s.includes('tushgan') || s.includes('lidlar')) return 'leads';
  if (s.includes('yozilgan')) return 'bd_written';
  if (s.includes('kelgan')) return 'bd_visited';
  if (s.includes('shartnoma')) return 'contracts';
  if (s.includes('ketgan')) return 'students_left';
  if (s.includes('muzlat')) return 'frozen';
  if (s.includes('qaytgan')) return 'returned';
  if (s.includes('video')) return 'group_videos';
  if (s.includes('qoldirilgan') || s.includes('darslar')) return 'missed_lessons';
  if (s.includes('tg') || s.includes('guruh')) return 'tg_control';
  if (s.includes('taksi')) return 'taxi_control';
  return null;
}

function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date && !isNaN(v)) return toISO(v);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})\s*[.,\/\-]\s*(\d{1,2})\s*[.,\/\-]\s*(\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = '20' + y;
  const mm = String(mo).padStart(2, '0'), dd = String(d).padStart(2, '0');
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return null;
  return `${y}-${mm}-${dd}`;
}

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return Math.max(0, Math.round(v));
  let s = String(v).trim();
  if (s === '' || s === '-' || s === '–' || s === '—') return 0;
  s = s.replace('%', '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function bool(v) {
  if (v === true) return true;
  if (typeof v === 'number') return v > 0;
  const s = String(v).trim().toLowerCase();
  return ['true', '1', 'ha', 'yes', 'x', '✓', '✔', 'bajarildi'].includes(s);
}

/**
 * Faylni o'qib, daily_reports yozuvlari massivini qaytaradi (branch_id'siz).
 * @returns {{ rows: object[], dates: string[], skipped: number }}
 */
export async function parseReportFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  if (!aoa.length) throw new Error('Fayl bo\'sh.');

  // Sarlavha qatorini topish
  let hr = -1;
  for (let i = 0; i < Math.min(aoa.length, 20); i++) {
    const row = aoa[i].map((x) => String(x).toLowerCase());
    if (row.some((c) => c.includes('sana')) && row.some((c) => c.includes('lid') || c.includes('quvchi'))) { hr = i; break; }
  }
  if (hr === -1) throw new Error('Sarlavha qatori topilmadi ("Sana", "O\'quvchilar..." bo\'lishi kerak).');

  // Ustun -> maydon xaritasi
  const colMap = {};
  aoa[hr].forEach((h, idx) => { const f = mapHeader(h); if (f && !(f in colMap)) colMap[f] = idx; });
  if (colMap.report_date == null) throw new Error('"Sana" ustuni topilmadi.');

  const NUM = ['students', 'leads', 'quality_leads', 'bd_written', 'bd_visited', 'contracts', 'students_left', 'frozen', 'returned', 'group_videos', 'missed_lessons'];
  const rows = []; const seen = new Set(); let skipped = 0;

  for (let i = hr + 1; i < aoa.length; i++) {
    const r = aoa[i];
    const date = parseDate(r[colMap.report_date]);
    if (!date) { skipped++; continue; }            // foiz qatori yoki bo'sh -> tashlab ketamiz
    if (seen.has(date)) continue;
    seen.add(date);

    const rec = { report_date: date };
    for (const f of NUM) if (colMap[f] != null) rec[f] = num(r[colMap[f]]);
    if (colMap.tg_control != null) rec.tg_control = bool(r[colMap.tg_control]);
    if (colMap.taxi_control != null) rec.taxi_control = bool(r[colMap.taxi_control]);
    rows.push(rec);
  }

  return { rows, dates: rows.map((r) => r.report_date), skipped };
}
