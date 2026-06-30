// ============================================================
//  Offline sinxronlash navbati.
//  Internet yo'qda mutatsiyalarni saqlaydi, ulanish qaytganda yuboradi.
//  iOS Safari'da Background Sync API yo'q — shuning uchun 'online'
//  event + focus/visibility orqali sinxronlaymiz.
// ============================================================
const QUEUE_KEY = 'tablexn.syncQueue';
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
}

function write(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  for (const fn of listeners) fn(queue.length);
}

/** Navbat o'zgarishini kuzatish (saqlash indikatori uchun). */
export function onQueueChange(fn) {
  listeners.add(fn);
  fn(read().length);
  return () => listeners.delete(fn);
}

export function pendingCount() { return read().length; }

export function enqueue(task) {
  const queue = read();
  queue.push({ id: crypto.randomUUID(), ts: Date.now(), ...task });
  write(queue);
}

let flushing = false;

/** Navbatni runner orqali bo'shatish. Xato bo'lsa to'xtaydi, keyin qayta urinadi. */
export async function flush(runner) {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    let queue = read();
    while (queue.length) {
      try {
        await runner(queue[0]);
        queue = read();
        queue.shift();
        write(queue);
      } catch {
        break; // ulanish/server xatosi — keyinroq qayta urinamiz
      }
    }
  } finally {
    flushing = false;
  }
}

/** Avtomatik sinxronlash triggerlarini o'rnatish. */
export function startAutoSync(runner) {
  const trigger = () => flush(runner);
  window.addEventListener('online', trigger);
  window.addEventListener('focus', trigger);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) trigger(); });
  trigger();
}
