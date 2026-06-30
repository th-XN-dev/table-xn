// ============================================================
//  Debounce / Throttle yordamchilari.
// ============================================================

/** Debounce — auto-save uchun (300–500ms). cancel/flush bilan. */
export function debounce(fn, delay = 400) {
  let t;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(t);
  debounced.flush = (...args) => { clearTimeout(t); fn(...args); };
  return debounced;
}

/** Throttle — scroll/resize uchun. */
export function throttle(fn, limit = 200) {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => { waiting = false; }, limit);
  };
}
