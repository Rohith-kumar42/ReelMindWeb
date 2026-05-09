const tabs = [
  { page: 'home', label: 'Home', icon: 'home', hash: '#home' },
  { page: 'library', label: 'Library', icon: 'library', hash: '#library' },
  { page: 'add', label: 'Add', icon: 'plus', hash: '#add', primary: true },
  { page: 'search', label: 'Search', icon: 'search', hash: '#search' },
];

function icon(name) {
  const paths = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
    library: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z"/><path d="M8 7h7M8 11h7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

export function renderBottomNav(activePage = 'home') {
  let nav = document.querySelector('.bottom-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    document.body.append(nav);
  }

  nav.innerHTML = tabs.map((tab) => `
    <a class="nav-item ${activePage === tab.page ? 'active' : ''} ${tab.primary ? 'nav-item--primary' : ''}" href="${tab.hash}" aria-label="${tab.label}">
      <span class="nav-item__icon">${icon(tab.icon)}</span>
      <span>${tab.label}</span>
    </a>
  `).join('');
}
