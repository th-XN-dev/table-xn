// ============================================================
//  Supabase mijozi (singleton). ESM CDN orqali yuklanadi —
//  ilova http(s) orqali xizmat qilinishi kerak (Netlify/dev server),
//  file:// dan ishlamaydi.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});
