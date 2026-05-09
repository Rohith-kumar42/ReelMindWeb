import { categoryFor, contentTitle, escapeHtml, externalUrl, formatConfidence, navigate } from './dom.js';
import { tagRow } from './TagChip.js';

export function createContentCard(item, options = {}) {
  const category = categoryFor(item);
  const color = category.color || 'oklch(0.43 0.16 275)';
  const card = document.createElement('article');
  card.className = 'content-card';
  card.style.setProperty('--category-color', color);
  card.tabIndex = 0;
  card.innerHTML = `
    <div class="content-card__accent" aria-hidden="true"></div>
    <div class="content-card__body">
      <div class="content-card__meta">
        <span class="type-badge">${escapeHtml(item.content_type || 'other')}</span>
        ${category.name ? `<span class="category-mini">${escapeHtml(category.name)}</span>` : ''}
        ${item.is_favorite ? '<span class="favorite-mark" aria-label="Favorite">Starred</span>' : ''}
      </div>
      <h3 class="content-card__title">${escapeHtml(contentTitle(item))}</h3>
      <p class="content-card__summary">${escapeHtml(item.summary || item.description || 'No summary yet.')}</p>
      ${tagRow(item.tags || [])}
      <div class="content-card__foot">
        <span><span class="confidence-dot"></span>${formatConfidence(item.confidence)}</span>
        ${externalUrl(item) ? '<span class="external-mark">External link</span>' : ''}
      </div>
    </div>
    <div class="card-actions" aria-hidden="true">
      <button type="button" data-action="favorite">${item.is_favorite ? 'Unstar' : 'Star'}</button>
      <button type="button" data-action="edit">Edit</button>
      <button type="button" data-action="delete">Delete</button>
    </div>
  `;

  const open = () => {
    if (options.onOpen) options.onOpen(item);
    else navigate(`#item/${item.id}`);
  };

  card.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action) {
      event.stopPropagation();
      options.onAction?.(action, item, card);
      return;
    }
    open();
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  let pressTimer = null;
  let startX = 0;

  card.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    pressTimer = setTimeout(() => card.classList.add('actions-open'), 520);
  });
  card.addEventListener('pointermove', (event) => {
    if (Math.abs(event.clientX - startX) > 46) card.classList.add('actions-open');
  });
  card.addEventListener('pointerup', () => clearTimeout(pressTimer));
  card.addEventListener('pointercancel', () => clearTimeout(pressTimer));
  card.addEventListener('mouseleave', () => clearTimeout(pressTimer));

  return card;
}
