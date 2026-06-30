# table.xn — Supabase ulanish va sozlash qo'llanmasi

Bu hujjat loyihani Supabase backend'iga ulash va ishga tushirishning to'liq bosqichlarini ko'rsatadi.

---

## 1. Supabase loyihasini yaratish

1. [supabase.com](https://supabase.com) ga kiring → **New project**.
2. Loyiha nomi, kuchli **database parol** (saqlab qo'ying) va eng yaqin region (masalan `Frankfurt`) tanlang.
3. Loyiha tayyor bo'lguncha 1-2 daqiqa kuting.

---

## 2. Ma'lumotlar bazasi sxemasini o'rnatish

1. Chap menyuda **SQL Editor** → **New query**.
2. `table-xn-schema.sql` faylining **to'liq mazmunini** nusxalab joylang.
3. **Run** (yoki `Ctrl/Cmd + Enter`).

Bu quyidagilarni yaratadi: `organizations`, `profiles`, `branches`, `daily_reports` jadvallari, barcha **RLS siyosatlari**, yordamchi funksiyalar va `create_organization` RPC.

Tekshirish: **Table Editor**'da 4 ta jadval ko'rinishi kerak. **Authentication → Policies**'da har bir jadval yonida yashil "RLS enabled" turishi kerak.

---

## 3. Ulanish kalitlarini olish va `config.js` ga qo'yish

Supabase'da: **Project Settings → API**.

| Kerakli qiymat | Qayerda |
|---|---|
| Project URL | `Project URL` |
| anon public key | `Project API keys → anon public` |

`config.js` faylini oching va shu ikki qiymatni qo'ying:

```js
export const SUPABASE_URL = 'https://abcdxyz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...'; // anon public key
```

> **Xavfsizlik:** `anon` kalit client'da ochiq turishi **normal** — u shunday mo'ljallangan. Ma'lumotni **RLS** himoya qiladi, kalit emas. `service_role` kalitni esa **hech qachon** frontend'ga qo'ymang.

---

## 4. Authentication sozlamalari

**Authentication → Sign In / Providers → Email**:

- **Confirm email** ni **o'chiring** (MVP uchun). Aks holda `signUp` darhol sessiya bermaydi va tashkilot yaratish (`create_organization` RPC) ishlamaydi.
  - Agar email tasdiqlashni qoldirmoqchi bo'lsangiz — kod buni `pendingConfirmation` orqali ushlaydi, lekin tashkilotni birinchi loginda yaratish mantig'ini qo'shish kerak bo'ladi.
- **Minimum password length**: 6 (kod ham shunga moslangan).

**URL Configuration → Site URL**: deploy qilingach, Netlify manzilingizni qo'ying (masalan `https://table-xn.netlify.app`).

---

## 5. Lokal ishga tushirish

ES Modules va CDN ishlatilgani uchun loyiha **server orqali** ochilishi kerak — `index.html` ni to'g'ridan-to'g'ri brauzerda ochish (`file://`) **ishlamaydi**.

```bash
# loyiha papkasida
npx serve table-xn
# yoki
python -m http.server 5173
```

Keyin `http://localhost:3000` (yoki ko'rsatilgan port) ni oching.

---

## 6. Birinchi sinov

1. **Ro'yxatdan o'tish** → tashkilot nomi + ism + email + parol.
2. Avtomatik ravishda siz shu tashkilotning **owner**'i bo'lasiz.
3. Dashboardda **filial qo'shing**.
4. Supabase **Table Editor → daily_reports / branches** da ma'lumot paydo bo'lishini tekshiring.

---

## 7. Netlify'ga deploy

1. Loyihani GitHub repoga yuklang.
2. Netlify → **Add new site → Import from Git** → repo'ni tanlang.
3. Build sozlamalari: **build command** — bo'sh, **publish directory** — loyiha ildizi (yoki `table-xn`).
4. Deploy bo'lgach, Netlify manzilini Supabase **Site URL** ga qo'shing (4-bandga qarang).

---

## 8. Jamoa a'zolarini qo'shish (hozircha qo'lda)

Hozircha ro'yxatdan o'tgan **har bir yangi foydalanuvchi o'z tashkilotini** yaratadi. Mavjud tashkilotga a'zo qo'shish uchun (taklif/invite oqimi keyinroq qo'shiladi):

1. Yangi xodim odatdagidek **ro'yxatdan o'tadi** (o'z vaqtinchalik tashkiloti yaratiladi).
2. Supabase **Table Editor → profiles** da o'sha foydalanuvchining qatorini toping.
3. Uning `org_id` ni **asosiy tashkilot** `org_id` siga o'zgartiring va `role` ni belgilang (`admin` / `manager` / `operator`).
4. (Ixtiyoriy) Ortib qolgan bo'sh tashkilotni `organizations`'dan o'chiring.

> Keyingi versiyada: email orqali taklif qilish (invite) oqimi va rol boshqaruvi UI'si.

---

## Tez-tez uchraydigan xatolar

| Belgi | Sabab / yechim |
|---|---|
| Sahifa oq, konsolda `Failed to fetch` / CORS | `file://` dan ochgansiz — serverdan ishga tushiring (5-band). |
| Ro'yxatdan o'tishda `Not authenticated` yoki RPC xatosi | "Confirm email" yoqilgan — uni o'chiring (4-band). |
| `Invalid API key` | `config.js` dagi URL/anon key noto'g'ri yoki almashib ketgan. |
| Login ishlaydi, lekin ma'lumot bo'sh | RLS to'g'ri, lekin foydalanuvchining `profiles` qatori yo'q — 8-bandga qarang. |
| Filial qo'shilmaydi (faqat ko'rinadi) | Rolingiz `operator` — filial qo'shish `owner`/`admin` uchun (RLS shunday). |

---

**table.xn** — by project.xn
