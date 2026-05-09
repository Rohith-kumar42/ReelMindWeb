import { api } from '../api.js';
import { createContentCard } from '../components/ContentCard.js';
import { emptyState, escapeHtml, navigate } from '../components/dom.js';
import { showToast } from '../components/Toast.js';

export default async function CategoryDetail(container, route) {
  const body = document.createElement('div');
  body.className = 'stack';
  body.innerHTML = '<div class="loading-row"><span class="spinner"></span>Loading category</div>';
  container.append(body);

  try {
    const [categoryRes, contentRes] = await Promise.all([
      api.getCategories(),
      api.getContent({ category_id: route.id, limit: 100 }),
    ]);

    const category = (categoryRes.categories || []).find((candidate) => candidate.id === route.id) || {};
    const items = contentRes.items || [];
    body.innerHTML = `
      <button class="back-button" type="button" data-back>Back</button>
      <section class="category-detail" style="--category-color:${escapeHtml(category.color || 'oklch(0.43 0.16 275)')}">
        <div class="category-detail__accent"></div>
        <p class="eyebrow">${items.length} saved</p>
        <h1>${escapeHtml(category.name || 'Category')}</h1>
      </section>
      <div class="content-list"></div>
    `;

    body.querySelector('[data-back]').addEventListener('click', () => navigate('#library'));
    const list = body.querySelector('.content-list');
    if (items.length) items.forEach((item) => list.append(createContentCard(item)));
    else list.append(emptyState({
      title: 'No saves in this category',
      body: 'New saves will appear here when the classifier places them in this category.',
      actionLabel: 'Add save',
      actionHash: '#add',
    }));
  } catch (err) {
    body.innerHTML = '';
    body.append(emptyState({ title: 'Category unavailable', body: err.message }));
    showToast(err.message, 'error');
  }
}
