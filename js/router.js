const ROUTES = new Set(['home','tip','golfer']);

export function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, '').split('/')[0];
  return ROUTES.has(raw) ? raw : 'home';
}

export function navigate(route) {
  const next = ROUTES.has(route) ? route : 'home';
  if (currentRoute() === next) {
    window.dispatchEvent(new CustomEvent('tip:route', { detail: { route: next } }));
    return;
  }
  location.hash = `#/${next}`;
}

export function startRouter(onRoute) {
  const emit = () => {
    const route = currentRoute();
    onRoute(route);
    window.dispatchEvent(new CustomEvent('tip:route', { detail: { route } }));
  };
  window.addEventListener('hashchange', emit);
  if (!location.hash) location.hash = '#/home';
  else emit();
  return () => window.removeEventListener('hashchange', emit);
}
