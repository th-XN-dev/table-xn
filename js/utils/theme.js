// ============================================================
//  Theme (light/dark) boshqaruvi.
//  FOUC oldini olish uchun har sahifa <head>'iga inline init qo'yiladi;
//  bu modul toggle tugmasi va joriy holatni beradi.
// ============================================================
const KEY = 'tablexn.theme';

export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(KEY, t);
  document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}

export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

/** Toggle tugmasini ulash. Ikona almashuvini o'zi boshqaradi. */
export function bindThemeToggle(button) {
  if (!button) return;
  const render = () => {
    const dark = currentTheme() === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? "Yorug' rejim" : "Qorong'i rejim");
  };
  render();
  button.addEventListener('click', () => { toggleTheme(); render(); });
  document.addEventListener('themechange', render);
}
