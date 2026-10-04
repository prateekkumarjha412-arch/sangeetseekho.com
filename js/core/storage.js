/* localStorage/sessionStorage that never throws (private mode, blocked cookies, full storage). */
function wrap(store) {
  return {
    get(key, fallback = null) {
      try { const v = store().getItem(key); return v == null ? fallback : JSON.parse(v); } catch (_) { return fallback; }
    },
    set(key, value) {
      try { store().setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
    },
    remove(key) { try { store().removeItem(key); } catch (_) {} },
  };
}
export const local = wrap(() => window.localStorage);
export const session = wrap(() => window.sessionStorage);
