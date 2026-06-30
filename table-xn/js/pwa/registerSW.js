// ============================================================
//  PWA: Service Worker ro'yxatdan o'tkazish + AVTO-YANGILANISH + install.
//  Yangi versiya kelganda sahifa avtomatik qayta yuklanadi —
//  eski kod keshda qolib ketmaydi.
// ============================================================
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      // Yangilanishni doim tekshirish
      reg.update?.();
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          // Yangi SW o'rnatildi va eski SW hali boshqaryapti -> yangisiga o'tib qayta yuklash
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    } catch { /* SW yo'q bo'lsa ham ilova ishlaydi */ }
  });
}

let deferredPrompt = null;

/** O'rnatish tugmasini ulash. Tugma faqat o'rnatish mumkin bo'lganda ko'rinadi. */
export function initInstallPrompt(button) {
  if (!button) return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
  window.addEventListener('appinstalled', () => { button.hidden = true; });
}
