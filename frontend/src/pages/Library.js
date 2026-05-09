import { api } from '../api.js';
import { createContentCard } from '../components/ContentCard.js';
import { createFilterBar } from '../components/FilterBar.js';
import { confirmDialog, editSheet } from '../components/Dialogs.js';
import { emptyState, pageHeader } from '../components/dom.js';
import { showToast } from '../components/Toast.js';

export default async function Library(container, route) {
  container.append(pageHeader({ title: 'Library', eyebrow: 'Saved items' }));
  const body = document.createElement('div');
  body.className = 'stack stack--wide';
  body.innerHTML = '<div class="loading-row"><span class="spinner"></span>Loading saved items</div>';
  container.append(body);

  let active = 'all';
  let items = [];
  const categoryId = route.query.category;

  function matchesFilter(item) {
    if (categoryId && item.category_id !== categoryId) return false;
    if (active === 'favorites') return Boolean(item.is_favorite);
    if (active === 'all') return true;
    return item.content_type === active;
  }

  function renderList() {
    const filtered = items.filter(matchesFilter);
    const list = body.querySelector('.content-list');
    list.innerHTML = '';
    if (!filtered.length) {
      list.append(emptyState({
        title: 'Nothing here yet',
        body: categoryId || active !== 'all' ? 'Clear the filter or add something new.' : 'Add a reel to build your library.',
        actionLabel: active !== 'all' ? 'Clear filter' : 'Add save',
        actionHash: active !== 'all' ? '#library' : '#add',
      }));
      return;
    }
    filtered.forEach((item) => list.append(createContentCard(item, { onAction: handleAction })));
  }

  async function handleAction(action, item) {
    if (action === 'favorite') {
      const updated = await api.updateItem(item.id, { is_favorite: !item.is_favorite });
      items = items.map((candidate) => candidate.id === item.id ? updated.item : candidate);
      showToast(updated.item.is_favorite ? 'Starred' : 'Unstarred');
      renderList();
    }

    if (action === 'edit') {
      editSheet({
        item,
        onSave: async (body) => {
          const updated = await api.updateItem(item.id, body);
          items = items.map((candidate) => candidate.id === item.id ? updated.item : candidate);
          showToast('Saved changes');
          renderList();
        },
      });
    }

    if (action === 'delete') {
      confirmDialog({
        title: 'Delete this save?',
        body: 'This removes it from your local ReelMind library.',
        onConfirm: async () => {
          await api.deleteItem(item.id);
          items = items.filter((candidate) => candidate.id !== item.id);
          showToast('Deleted');
          renderList();
        },
      });
    }
  }

  try {
    const res = await api.getContent({ limit: 100 });
    items = res.items || [];
    body.innerHTML = '<div class="filter-slot"></div><div class="content-list"></div>';
    const onFilterChange = (next) => {
      active = next;
      body.querySelector('.filter-slot').innerHTML = '';
      body.querySelector('.filter-slot').append(createFilterBar(active, onFilterChange));
      renderList();
    };
    body.querySelector('.filter-slot').append(createFilterBar(active, onFilterChange));
    renderList();
  } catch (err) {
    body.innerHTML = '';
    body.append(emptyState({ title: 'Library unavailable', body: err.message }));
    showToast(err.message, 'error');
  }
}
