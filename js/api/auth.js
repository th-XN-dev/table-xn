// ============================================================
//  Auth — Supabase Auth ustida. Custom users jadvali YO'Q.
// ============================================================
import { supabase } from './supabaseClient.js';

// ---- Foydalanuvchi nomi <-> sintetik email ----
// Email kiritilsa (@ bilan) — o'zi ishlatiladi; aks holda foydalanuvchi nomi
// "nom@tablexn.local" ga aylanadi. Shu bilan login emailsiz bo'ladi.
const AUTH_DOMAIN = 'tablexn.local';
export const toEmail = (id) => {
  const s = String(id || '').trim().toLowerCase();
  return s.includes('@') ? s : `${s}@${AUTH_DOMAIN}`;
};
export const toUsername = (email) => {
  const s = String(email || '');
  return s.endsWith('@' + AUTH_DOMAIN) ? s.split('@')[0] : s;
};

/**
 * Ro'yxatdan o'tish: foydalanuvchi + tashkilot (owner) yaratiladi.
 * DIQQAT: Supabase'da "Confirm email" YOQILGAN bo'lsa, signUp sessiya
 * qaytarmaydi va create_organization RPC ishlamaydi (auth.uid() null).
 * MVP uchun: Dashboard > Authentication > Email > "Confirm email" ni o'chiring.
 */
export async function signUp({ username, password, orgName, ownerName }) {
  const email = toEmail(username);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  if (!data.session) {
    // Email tasdiqlash yoqilgan — org keyinroq, birinchi loginda yaratiladi.
    return { user: data.user, pendingConfirmation: true };
  }

  // onboard: taklif bo'lsa o'sha tashkilotga qo'shadi, bo'lmasa yangi tashkilot ochadi
  const { error: rpcError } = await supabase.rpc('onboard', {
    org_name: orgName,
    owner_name: ownerName,
  });
  if (rpcError) throw rpcError;
  return { user: data.user, pendingConfirmation: false };
}

export async function signIn({ username, password }) {
  const email = toEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Joriy foydalanuvchi parolini o'zgartirish. */
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Foydalanuvchi nomini (login) o'zgartirish. Ichida sintetik email yangilanadi. */
export async function changeUsername(newUsername) {
  const email = toEmail(newUsername);
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('profiles').update({ email }).eq('id', user.id);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Joriy foydalanuvchi profili + tashkilot ma'lumoti. */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, org_id, full_name, role, organizations(name, plan)')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

/** Sahifa guard: sessiya yo'q bo'lsa login'ga yo'naltiradi. */
export async function requireAuth(redirect = 'login.html') {
  const session = await getSession();
  if (!session) {
    window.location.href = redirect;
    return null;
  }
  return session;
}

/** Allaqachon kirgan bo'lsa, login sahifasidan dashboardga yuboradi. */
export async function redirectIfAuthed(target = 'dashboard.html') {
  const session = await getSession();
  if (session) window.location.href = target;
}
