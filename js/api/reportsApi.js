// ============================================================
//  Reports API — daily_reports va branches bilan ishlash.
//  Auto-save: upsert (branch_id, report_date) bo'yicha.
//  org_id yuborilmaydi — DB trigger uni branch'dan oladi.
// ============================================================
import { supabase } from './supabaseClient.js';
import { enqueue, startAutoSync } from '../pwa/syncQueue.js';

// ---------- Branches ----------
export async function listBranches() {
  const { data, error } = await supabase
    .from('branches').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data;
}

export async function createBranch(name) {
  const { data, error } = await supabase
    .from('branches').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

// Barcha filiallar (faolsizlar bilan) — sozlamalar uchun
export async function listAllBranches() {
  const { data, error } = await supabase
    .from('branches').select('*').order('name');
  if (error) throw error;
  return data;
}

// Filialni tahrirlash (nom, faollik)
export async function updateBranch(id, fields) {
  const { data, error } = await supabase
    .from('branches').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function setBranchActive(id, is_active) {
  return updateBranch(id, { is_active });
}

// Filialni o'chirish (hisobotlari bilan birga — ehtiyot bo'ling)
export async function deleteBranch(id) {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Reports ----------
export async function getReport(branchId, date) {
  const { data, error } = await supabase
    .from('daily_reports').select('*')
    .eq('branch_id', branchId).eq('report_date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listReports({ branchId, from, to } = {}) {
  let q = supabase.from('daily_reports').select('*').order('report_date');
  if (branchId) q = q.eq('branch_id', branchId);
  if (from) q = q.gte('report_date', from);
  if (to) q = q.lte('report_date', to);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function upsertReport(record) {
  const { data, error } = await supabase
    .from('daily_reports')
    .upsert(record, { onConflict: 'branch_id,report_date' })
    .select().single();
  if (error) throw error;
  return data;
}

/**
 * Offline-aware saqlash.
 * Online → darhol upsert. Xato yoki offline → navbatga qo'shiladi.
 * @returns saqlangan yozuv, yoki navbatga olingan bo'lsa { _queued: true }.
 */
export async function saveReport(record) {
  if (navigator.onLine) {
    try {
      return await upsertReport(record);
    } catch (e) {
      enqueue({ type: 'upsertReport', record });
      throw e;
    }
  }
  enqueue({ type: 'upsertReport', record });
  return { ...record, _queued: true };
}

/** syncQueue runner — navbatdagi vazifani bajaradi. */
export async function runSyncTask(task) {
  if (task.type === 'upsertReport') return upsertReport(task.record);
  throw new Error('Noma\'lum vazifa turi: ' + task.type);
}

/** Ilova ochilganda chaqiriladi — offline navbat avtomatik sinxronlanadi. */
export function initReportsSync() {
  startAutoSync(runSyncTask);
}

/** Ko'p hisobotni bir martada upsert qilish (import uchun). */
export async function bulkUpsertReports(records) {
  if (!records?.length) return [];
  const { data, error } = await supabase
    .from('daily_reports')
    .upsert(records, { onConflict: 'branch_id,report_date' })
    .select();
  if (error) throw error;
  return data;
}
