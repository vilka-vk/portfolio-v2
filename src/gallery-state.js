export function groupFromHash(hash) {
  return hash === '#concepts' ? 'concepts' : hash === '#cases' ? 'cases' : null;
}

export function groupAfterKey(group, key) {
  if (key === 'Home') return 'cases';
  if (key === 'End') return 'concepts';
  if (key === 'ArrowLeft' || key === 'ArrowRight') return group === 'cases' ? 'concepts' : 'cases';
  return null;
}

export function createGalleryNavigation(win, onChange) {
  const sync = () => {
    const group = groupFromHash(win.location.hash);
    if (group) onChange(group);
  };
  win.addEventListener('hashchange', sync);
  win.addEventListener('popstate', sync);
  sync();
  return {
    select(group) {
      if (!['cases', 'concepts'].includes(group)) return;
      const url = new URL(win.location.href);
      url.hash = group;
      win.history.replaceState(win.history.state, '', url);
      onChange(group);
    },
    dispose() {
      win.removeEventListener('hashchange', sync);
      win.removeEventListener('popstate', sync);
    },
  };
}
