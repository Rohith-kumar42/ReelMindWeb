import { api } from '../api.js';
import { createContentCard } from '../components/ContentCard.js';
import { confirmDialog, editSheet } from '../components/Dialogs.js';
import { emptyState, escapeHtml, externalUrl, formatConfidence, navigate } from '../components/dom.js';
import { tagRow } from '../components/TagChip.js';
import { showToast } from '../components/Toast.js';

export default async function ItemDetail(container, route) {
  const body = document.createElement('div');
  body.className = 'stack';
  body.innerHTML = '<div class="loading-row"><span class="spinner"></span>Loading save</div>';
  container.append(body);

  let item = null;
  let recommendations = [];

  async function load() {
    const [itemRes, recRes] = await Promise.all([
      api.getItem(route.id),
      api.recommend(route.id).catch(() => ({ items: [] })),
    ]);
    item = itemRes.item;
    recommendations = recRes.items || [];
    render();
  }

  function render() {
    const category = item.categories || {};
    body.innerHTML = `
      <button class="back-button" type="button" data-back>Back</button>
      <article class="detail">
        ${item.thumbnail_url ? `<img class="detail-hero" src="${escapeHtml(item.thumbnail_url)}" alt="" />` : '<div class="detail-hero detail-hero--empty">ReelMind</div>'}
        <div class="detail-main">
          <div class="chip-line">
            <span class="category-chip" style="--category-color:${escapeHtml(category.color || 'oklch(0.43 0.16 275)')}">${escapeHtml(category.name || 'Uncategorized')}</span>
            <span class="type-badge">${escapeHtml(item.content_type || 'other')}</span>
            <span><span class="confidence-dot"></span>${formatConfidence(item.confidence)}</span>
          </div>
          <h1>${escapeHtml(item.title || 'Untitled save')}</h1>
          <p class="detail-summary">${escapeHtml(item.summary || 'No summary yet.')}</p>
          ${tagRow(item.tags || [])}
          ${item.notes ? `<section class="notes-block"><h2>Notes</h2><p>${escapeHtml(item.notes)}</p></section>` : ''}
          <div class="link-row">
            ${item.reel_url ? `<a class="btn btn-secondary" href="${escapeHtml(item.reel_url)}" target="_blank" rel="noreferrer">Open Reel</a>` : ''}
            ${item.link_url ? `<a class="btn btn-secondary" href="${escapeHtml(item.link_url)}" target="_blank" rel="noreferrer">Open Resource</a>` : ''}
          </div>
          <div class="action-bar">
            <button class="btn btn-secondary" type="button" data-favorite>${item.is_favorite ? 'Unstar' : 'Star'}</button>
            <button class="btn btn-secondary" type="button" data-edit>Edit</button>
            <button class="btn btn-danger" type="button" data-delete>Delete</button>
          </div>
        </div>
      </article>
      <section>
        <div class="section-title"><h2>Similar items</h2></div>
        <div class="content-list recommendations"></div>
      </section>
    `;

    body.querySelector('[data-back]').addEventListener('click', () => history.length > 1 ? history.back() : navigate('#library'));
    body.querySelector('[data-favorite]').addEventListener('click', toggleFavorite);
    body.querySelector('[data-edit]').addEventListener('click', openEdit);
    body.querySelector('[data-delete]').addEventListener('click', deleteItem);

    const list = body.querySelector('.recommendations');
    if (recommendations.length) recommendations.forEach((rec) => list.append(createContentCard(rec)));
    else list.innerHTML = '<p class="muted">Similar saves appear as your library grows.</p>';
  }

  async function toggleFavorite() {
    const updated = await api.updateItem(item.id, { is_favorite: !item.is_favorite });
    item = updated.item;
    showToast(item.is_favorite ? 'Starred' : 'Unstarred');
    render();
  }

  function openEdit() {
    editSheet({
      item,
      onSave: async (body) => {
        const updated = await api.updateItem(item.id, body);
        item = updated.item;
        showToast('Saved changes');
        render();
      },
    });
  }

  function deleteItem() {
    confirmDialog({
      title: 'Delete this save?',
      body: 'This removes it from your local ReelMind library.',
      onConfirm: async () => {
        await api.deleteItem(item.id);
        showToast('Deleted');
        navigate('#library');
      },
    });
  }

  try {
    await load();
  } catch (err) {
    body.innerHTML = '';
    body.append(emptyState({ title: 'Save unavailable', body: err.message, actionLabel: 'Back to library', actionHash: '#library' }));
    showToast(err.message, 'error');
  }
}
