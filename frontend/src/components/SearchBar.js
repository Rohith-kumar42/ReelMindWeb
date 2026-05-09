import { escapeHtml } from './dom.js';

export function createSearchBar({ value = '', placeholder = 'Search saved ideas', onSubmit }) {
  const form = document.createElement('form');
  form.className = 'search-bar-wrap';
  form.innerHTML = `
    <span class="search-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>
    </span>
    <input class="search-bar-input" type="search" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
    <button class="search-clear" type="button" aria-label="Clear">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"></path></svg>
    </button>
  `;

  const input = form.querySelector('input');
  const clear = form.querySelector('.search-clear');
  const syncClear = () => clear.classList.toggle('visible', Boolean(input.value));
  syncClear();

  input.addEventListener('input', syncClear);
  clear.addEventListener('click', () => {
    input.value = '';
    input.focus();
    syncClear();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit(input.value.trim());
  });

  return { form, input };
}
