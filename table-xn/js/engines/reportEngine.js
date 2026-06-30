// ============================================================
//  Report engine — barcha hisobotlar faqat daily_reports'dan
//  dynamic generatsiya qilinadi. Weekly/Monthly hech qachon saqlanmaydi.
// ============================================================
import { listReports } from '../api/reportsApi.js';
import * as A from './analyticsEngine.js';
import * as D from '../utils/dates.js';

const METRICS = [
  'students', 'leads', 'quality_leads', 'bd_written', 'bd_visited',
  'contracts', 'students_left', 'frozen', 'returned',
  'group_videos', 'individual_videos', 'missed_lessons',
];

function aggregate(rows) {
  const sorted = [...rows].sort((a, b) => a.report_date.localeCompare(b.report_date));
  const totals = {};
  for (const m of METRICS) totals[m] = A.sum(rows, m);

  return {
    count: rows.length,
    totals,
    leadQuality: A.leadQuality(rows),
    contractConversion: A.contractConversion(rows),
    visitRate: A.visitRate(rows),
    attendanceRate: A.attendanceRate(rows),
    averageGrowth: A.averageGrowth(sorted),
    growthSeries: A.growthSeries(sorted),
    trend: A.trend(sorted.map((r) => r.students)),
    rows: sorted,
  };
}

export async function getDaily(branchId, date = D.today()) {
  return aggregate(await listReports({ branchId, from: date, to: date }));
}
export async function getWeekly(branchId, date = D.today()) {
  return aggregate(await listReports({ branchId, from: D.startOfWeek(date), to: D.endOfWeek(date) }));
}
export async function getMonthly(branchId, date = D.today()) {
  return aggregate(await listReports({ branchId, from: D.startOfMonth(date), to: D.endOfMonth(date) }));
}
export async function getYearly(branchId, date = D.today()) {
  return aggregate(await listReports({ branchId, from: D.startOfYear(date), to: D.endOfYear(date) }));
}
export async function getCustomRange(branchId, from, to) {
  return aggregate(await listReports({ branchId, from, to }));
}

/** Dashboard: bugun + hafta + oy, kechagi bilan taqqoslangan holda. */
export async function getDashboard(branchId, date = D.today()) {
  const [day, week, month, yesterday] = await Promise.all([
    getDaily(branchId, date),
    getWeekly(branchId, date),
    getMonthly(branchId, date),
    getDaily(branchId, D.addDays(date, -1)),
  ]);

  const compare = {};
  for (const m of METRICS) {
    const c = day.totals[m];
    const p = yesterday.totals[m];
    compare[m] = { current: c, previous: p, diff: A.diff(c, p), percent: A.percentDiff(c, p) };
  }

  return { day, week, month, yesterday, compare };
}

export { METRICS };
