import { escapeHtml, navigate } from './dom.js';

export function createCategoryCard(category) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'category-card';
  card.style.setProperty('--category-color', category.color || 'oklch(0.43 0.16 275)');
  card.innerHTML = `
    <span class="category-card__swatch" aria-hidden="true"></span>
    <span class="category-card__text">
      <span class="category-card__name">${escapeHtml(category.name)}</span>
      <span class="category-card__sub">${category.item_count || category.count || 0} saved</span>
    </span>
  `;
  card.addEventListener('click', () => navigate(`#category/${category.id}`));
  return card;
}
