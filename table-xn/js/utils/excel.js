// ============================================================
//  Excel eksport (SheetJS, CDN). Hisobotlarni .xlsx qilib yuklaydi.
// ============================================================
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const COLS = [
  ['report_date', 'Sana'], ['students', "O'quvchilar"], ['leads', 'Lidlar'],
  ['quality_leads', 'Sifatli lidlar'], ['bd_written', 'BD yozilgan'], ['bd_visited', 'BD tashrif'],
  ['contracts', 'Shartnomalar'], ['students_left', 'Ketganlar'], ['frozen', 'Muzlatilgan'],
  ['returned', 'Qaytganlar'], ['group_videos', 'Guruh videolari'], ['individual_videos', 'Individual videolar'],
  ['missed_lessons', 'Qoldirilgan darslar'], ['nps', 'NPS'], ['tg_control', 'TG nazorat'], ['taxi_control', 'Taksi nazorat'],
];

export function exportReportsXlsx({ rows = [], branchName = 'Filial', periodLabel = 'hisobot', from = '', to = '' }) {
  if (!rows.length) { throw new Error('empty'); }

  const data = rows.map((r) => {
    const o = {};
    for (const [k, label] of COLS) {
      o[label] = (k === 'tg_control' || k === 'taxi_control')
        ? (r[k] ? 'Ha' : "Yo'q")
        : (r[k] ?? '');
    }
    return o;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: COLS.map(([, l]) => l) });
  ws['!cols'] = COLS.map(([k]) => ({ wch: k === 'report_date' ? 12 : 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hisobot');

  const safe = String(branchName).replace(/[^\p{L}\p{N}_-]+/gu, '_');
  XLSX.writeFile(wb, `tablexn_${safe}_${periodLabel}_${from}_${to}.xlsx`);
}
