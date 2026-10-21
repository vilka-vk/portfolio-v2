const key = 'vm-v2-lang';
const listeners = new Set();
let current;

export function getLanguage() {
  if (current === undefined) {
    current = 'ru';
    try { current = localStorage.getItem(key) === 'en' ? 'en' : 'ru'; } catch { /* Storage is optional. */ }
  }
  return current;
}

export const getServerLanguage = () => 'ru';

export function setLanguage(value) {
  const next = value === 'en' ? 'en' : 'ru';
  if (next === getLanguage()) return;
  current = next;
  try { localStorage.setItem(key, next); } catch { /* Keep the preference in memory. */ }
  listeners.forEach(notify => notify());
}

function onStorage(event) {
  if (event.key !== key && event.key !== null) return;
  current = undefined;
  listeners.forEach(notify => notify());
}

export function subscribeLanguage(notify) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}
