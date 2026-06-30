// ============================================================
//  Validation engine — cross-field mantiqiy tekshiruvlar.
//  Bloklamaydi, ogohlantiradi. Manfiy/dublikat allaqachon DB
//  darajasida bloklangan; bu yerda biznes-mantiq.
// ============================================================

const COUNT_FIELDS = [
  'students', 'leads', 'quality_leads', 'bd_written', 'bd_visited',
  'contracts', 'students_left', 'frozen', 'returned',
  'group_videos', 'individual_videos', 'missed_lessons',
];

const n = (v) => Number(v) || 0;

export function validateReport(r, { existingDates = [], previousStudents = null } = {}) {
  const issues = [];
  const warn = (field, message) => issues.push({ field, level: 'warning', message });
  const error = (field, message) => issues.push({ field, level: 'error', message });

  if (n(r.quality_leads) > n(r.leads))
    error('quality_leads', "Sifatli lidlar umumiy lidlardan ko'p bo'lishi mumkin emas.");

  if (n(r.contracts) > n(r.bd_visited))
    error('contracts', "Shartnomalar tashrif buyurganlardan ko'p bo'lishi mumkin emas.");

  if (n(r.bd_visited) > n(r.bd_written))
    warn('bd_visited', "Tashrif buyurganlar yozilganlardan ko'p — tekshiring.");

  if (n(r.returned) > n(r.students_left))
    warn('returned', "Qaytganlar ketganlardan ko'p — odatda kamroq bo'ladi.");

  if (r.nps != null && r.nps !== '' && (n(r.nps) < -100 || n(r.nps) > 100))
    error('nps', "NPS -100 va 100 oralig'ida bo'lishi kerak.");

  for (const k of COUNT_FIELDS) {
    if (r[k] != null && Number(r[k]) < 0) error(k, "Manfiy qiymat kiritib bo'lmaydi.");
  }

  // ---- BALANS / DEFITSIT tekshiruvi ----
  // Kirim (keldi) va chiqim (ketdi) umumiy songa to'g'ri kelishi kerak.
  // Kecha {prev} edi → bugun (prev + keldi − ketdi) bo'lishi kutiladi.
  if (previousStudents != null) {
    const inflow = n(r.contracts) + n(r.returned);   // yangi + qaytgan
    const outflow = n(r.students_left);              // ketgan
    const moved = inflow + outflow;

    if (moved > 0) {
      const expected = previousStudents + inflow - outflow;
      const actual = n(r.students);
      const mismatch = actual - expected;

      if (mismatch !== 0) {
        warn(
          'students',
          `Hisob nomuvofiq: kecha ${previousStudents} o'quvchi edi, bugun ${inflow} qo'shildi va ` +
          `${outflow} ketdi — demak ${expected} bo'lishi kerak. Lekin ${actual} kiritildi ` +
          `(farq: ${mismatch > 0 ? '+' : ''}${mismatch}). Ma'lumotni tekshiring.`
        );
      }
    }
  }

  if (r.report_date && existingDates.includes(r.report_date))
    warn('report_date', "Bu sana uchun hisobot mavjud — ustiga yoziladi.");

  return { valid: !issues.some((i) => i.level === 'error'), issues };
}
