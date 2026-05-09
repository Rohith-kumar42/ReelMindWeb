const filters = ['favorites', 'all', 'tool', 'course', 'repo', 'resource', 'framework', 'extension', 'other'];

export function createFilterBar(active, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'filter-bar';
  wrap.innerHTML = filters.map((filter) => `
    <button class="filter-chip ${filter === active ? 'active' : 'inactive'}" type="button" data-filter="${filter}">
      ${filter === 'favorites' ? 'Starred' : filter}
    </button>
  `).join('');

  wrap.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    onChange(button.dataset.filter);
  });

  return wrap;
}
