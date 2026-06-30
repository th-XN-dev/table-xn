// ============================================================
//  Team API — jamoa a'zolari va takliflar.
//  RLS: ko'rish org a'zolariga; o'zgartirish owner/admin'ga.
// ============================================================
import { supabase } from './supabaseClient.js';

// ---------- A'zolar ----------
export async function listMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, email, created_at')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function updateMemberRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

export async function removeMember(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Takliflar ----------
export async function listInvites() {
  const { data, error } = await supabase
    .from('invites').select('*').eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInvite(email, role) {
  const { data, error } = await supabase
    .from('invites')
    .insert({ email: email.toLowerCase().trim(), role })
    .select().single();
  if (error) throw error;
  return data;
}

export async function cancelInvite(id) {
  const { error } = await supabase.from('invites').delete().eq('id', id);
  if (error) throw error;
}
