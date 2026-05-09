import { api } from '../api.js';
import { createContentCard } from '../components/ContentCard.js';
import { createSearchBar } from '../components/SearchBar.js';
import { emptyState, escapeHtml, pageHeader } from '../components/dom.js';
import { showToast } from '../components/Toast.js';

export default async function Search(container) {
  container.append(pageHeader({ title: 'Search', eyebrow: 'Semantic lookup' }));
  const body = document.createElement('div');
  body.className = 'stack';
  const resultSlot = document.createElement('div');
  resultSlot.className = 'content-list';

  const { form, input } = createSearchBar({
    onSubmit: (query) => runSearch(query, resultSlot),
  });

  body.append(form);
  const chips = document.createElement('div');
  chips.className = 'suggestion-row';
  body.append(chips, resultSlot);
  container.append(body);

  try {
    const res = await api.getSuggestions();
    (res.suggestions || []).forEach((suggestion) => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.type = 'button';
      chip.textContent = suggestion;
      chip.addEventListener('click', () => {
        input.value = suggestion;
        runSearch(suggestion, resultSlot);
      });
      chips.append(chip);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function runSearch(query, resultSlot) {
  if (!query) return;
  resultSlot.innerHTML = '<div class="loading-row"><span class="spinner"></span>Searching</div>';
  try {
    const res = await api.search(query);
    const items = res.items || [];
    resultSlot.innerHTML = '';
    if (!items.length) {
      resultSlot.append(emptyState({
        title: `Nothing found for "${escapeHtml(query)}"`,
        body: 'Try a different phrase or a broader category.',
      }));
      return;
    }
    items.forEach((item) => resultSlot.append(createContentCard(item)));
  } catch (err) {
    resultSlot.innerHTML = '';
    resultSlot.append(emptyState({ title: 'Search failed', body: err.message }));
    showToast(err.message, 'error');
  }
}
