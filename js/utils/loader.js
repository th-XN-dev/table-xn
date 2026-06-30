// ============================================================
//  Loader — yuqori qism progress bari. Yuklash pauzalarini yashiradi.
//  Element o'zi yaratiladi; sahifalar faqat show/hide chaqiradi.
// ============================================================
let bar = null;
let count = 0;

function ensure() {
  if (bar && document.body.contains(bar)) return bar;
  bar = document.createElement('div');
  bar.id = 'tablexn-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  return bar;
}

export function showLoader() {
  count++;
  const b = ensure();
  b.style.transition = 'none';
  b.style.opacity = '1';
  b.style.width = '0%';
  void b.offsetWidth; // reflow
  b.style.transition = 'width 8s cubic-bezier(.1,.7,.3,1)';
  b.style.width = '90%';
}

export function hideLoader() {
  count = Math.max(0, count - 1);
  if (count > 0 || !bar) return;
  bar.style.transition = 'width .25s ease, opacity .4s ease .2s';
  bar.style.width = '100%';
  bar.style.opacity = '0';
  setTimeout(() => { if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; } }, 650);
}

/** Async funksiyani loader bilan o'rab bajaradi. */
export async function withLoader(fn) {
  showLoader();
  try { return await fn(); }
  finally { hideLoader(); }
}
