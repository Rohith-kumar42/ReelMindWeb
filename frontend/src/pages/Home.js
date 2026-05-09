import { api } from '../api.js';
import { createCategoryCard } from '../components/CategoryCard.js';
import { createContentCard } from '../components/ContentCard.js';
import { emptyState, navigate, pageHeader } from '../components/dom.js';
import { showToast } from '../components/Toast.js';

export default async function Home(container) {
  container.append(pageHeader({ title: 'ReelMind', eyebrow: 'Local library' }));
  const body = document.createElement('div');
  body.className = 'stack';
  body.innerHTML = '<div class="loading-row"><span class="spinner"></span>Loading library</div>';
  container.append(body);

  try {
    const [contentRes, categoryRes] = await Promise.all([
      api.getContent({ limit: 6 }),
      api.getCategories(),
    ]);
    const items = contentRes.items || [];
    const categories = categoryRes.categories || [];

    body.innerHTML = `
      <section class="metrics-row">
        <button class="metric-tile" type="button" data-go="#library"><strong>${contentRes.total ?? items.length}</strong><span>Saved</span></button>
        <button class="metric-tile" type="button" data-go="#library"><strong>${categories.length}</strong><span>Categories</span></button>
      </section>
      <section>
        <div class="section-title"><h2>Categories</h2></div>
        <div class="category-rail"></div>
      </section>
      <section>
        <div class="section-title"><h2>Recent saves</h2><button class="text-link" type="button" data-go="#library">View all</button></div>
        <div class="content-list"></div>
      </section>
    `;

    body.querySelectorAll('[data-go]').forEach((button) => {
      button.addEventListener('click', () => navigate(button.dataset.go));
    });

    const rail = body.querySelector('.category-rail');
    if (categories.length) {
      categories.forEach((category) => rail.append(createCategoryCard(category)));
    } else {
      rail.innerHTML = '<p class="muted">Categories appear after your first save.</p>';
    }

    const list = body.querySelector('.content-list');
    if (items.length) {
      items.forEach((item) => list.append(createContentCard(item)));
    } else {
      list.replaceWith(emptyState({
        title: 'Start a library worth returning to',
        body: 'Save a reel, attach a useful resource, and let the pipeline organize it.',
        actionLabel: 'Add first save',
        actionHash: '#add',
      }));
    }
  } catch (err) {
    body.innerHTML = '';
    body.append(emptyState({
      title: 'Backend is not reachable',
      body: err.message,
      actionLabel: 'Try again',
      actionHash: '#home',
    }));
    showToast(err.message, 'error');
  }
}
