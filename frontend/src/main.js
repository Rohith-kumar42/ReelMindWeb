import './styles/tokens.css';
import { renderBottomNav } from './components/BottomNav.js';

function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) {
    document.documentElement.dataset.theme = stored;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.dataset.theme = 'dark';
  } else {
    document.documentElement.dataset.theme = 'light';
  }
}
initTheme();

export function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
}

const routes = {
  '': () => import('./pages/Home.js'),
  home: () => import('./pages/Home.js'),
  library: () => import('./pages/Library.js'),
  add: () => import('./pages/Add.js'),
  search: () => import('./pages/Search.js'),
  item: () => import('./pages/ItemDetail.js'),
  category: () => import('./pages/CategoryDetail.js'),
};

export function parseHash() {
  const raw = location.hash.replace('#', '') || 'home';
  const [path, queryString = ''] = raw.split('?');
  const [page, id] = path.split('/');
  return {
    page: page || 'home',
    id,
    query: Object.fromEntries(new URLSearchParams(queryString)),
  };
}

async function render() {
  const route = parseHash();
  const loader = routes[route.page] || routes.home;
  const mod = await loader();
  const app = document.getElementById('app');
  app.innerHTML = '<main class="page-shell" data-route-enter></main>';
  const page = app.querySelector('main');
  await mod.default(page, route);
  renderBottomNav(route.page);
}

window.addEventListener('hashchange', render);
window.addEventListener('reelmind:navigate', render);
render();
