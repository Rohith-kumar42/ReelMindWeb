export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setBusy(button, busy, label = 'Working') {
  if (!button) return;
  button.disabled = busy;
  button.dataset.originalText ||= button.textContent;
  button.innerHTML = busy ? `<span class="spinner" aria-hidden="true"></span>${label}` : button.dataset.originalText;
}

export function categoryFor(item = {}) {
  return item.categories || item.category || {};
}

export function contentTitle(item = {}) {
  return item.title || 'Untitled save';
}

export function formatConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'n/a';
  return `${Math.round(number * 100)}%`;
}

export function externalUrl(item = {}) {
  return item.link_url || item.linkUrl || item.reel_url || item.reelUrl || '';
}

export function navigate(hash) {
  location.hash = hash;
  window.dispatchEvent(new CustomEvent('reelmind:navigate'));
}

export function emptyState({ title, body, actionLabel, actionHash }) {
  const wrap = document.createElement('section');
  wrap.className = 'empty-state';
  wrap.innerHTML = `
    <div class="empty-state__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
    </div>
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(body)}</p>
    ${actionLabel ? `<button class="btn btn-primary" type="button">${escapeHtml(actionLabel)}</button>` : ''}
  `;
  if (actionLabel && actionHash) {
    wrap.querySelector('button').addEventListener('click', () => navigate(actionHash));
  }
  return wrap;
}

export function pageHeader({ eyebrow, title, action }) {
  const header = document.createElement('header');
  header.className = 'page-header';
  
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle Theme');
  themeToggle.innerHTML = '<svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  
  import('../main.js').then(({ toggleTheme }) => {
    themeToggle.onclick = toggleTheme;
  });

  const actionContainer = document.createElement('div');
  actionContainer.className = 'page-header__actions';
  if (action) actionContainer.append(action);
  actionContainer.append(themeToggle);

  header.innerHTML = `
    <div class="page-header__copy">
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
      <h1>${escapeHtml(title)}</h1>
    </div>
  `;
  header.append(actionContainer);
  return header;
}
