import { api } from '../api.js';
import { createAILoadingState } from '../components/AILoadingState.js';
import { escapeHtml, formatConfidence, navigate, pageHeader, setBusy } from '../components/dom.js';
import { tagRow } from '../components/TagChip.js';
import { showToast } from '../components/Toast.js';

export default async function Add(container) {
  container.append(pageHeader({ title: 'Add', eyebrow: 'Analyze and save' }));
  const body = document.createElement('div');
  body.className = 'stack';
  body.innerHTML = `
    <form class="add-form">
      <label>Reel URL<input name="reelUrl" type="url" placeholder="https://www.instagram.com/reel/..." required /></label>
      <p class="field-error" data-error-for="reelUrl"></p>
      <label>Resource URL<input name="linkUrl" type="url" placeholder="https://..." /></label>
      <label>Notes<textarea name="notes" rows="6" maxlength="5000" placeholder="Why this is worth saving"></textarea><span class="char-count">0/5000</span></label>
      <button class="btn btn-primary btn-block" type="submit">Analyze</button>
    </form>
    <div class="analysis-slot"></div>
  `;
  container.append(body);

  const form = body.querySelector('form');
  const notes = form.elements.notes;
  const counter = body.querySelector('.char-count');
  notes.addEventListener('input', () => {
    counter.textContent = `${notes.value.length}/5000`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const reelUrl = form.elements.reelUrl.value.trim();
    const linkUrl = form.elements.linkUrl.value.trim();
    const noteText = notes.value.trim();
    const error = body.querySelector('[data-error-for="reelUrl"]');
    const button = form.querySelector('[type="submit"]');
    const slot = body.querySelector('.analysis-slot');

    error.textContent = '';
    if (!reelUrl.startsWith('http')) {
      error.textContent = 'Enter a full URL starting with http.';
      return;
    }

    const loading = createAILoadingState();
    slot.innerHTML = '';
    slot.append(loading.el);
    loading.start();
    setBusy(button, true, 'Analyzing');

    try {
      const res = await api.preview({ reelUrl, linkUrl, notes: noteText });
      loading.finish();
      renderPreview(slot, res.preview, { reelUrl, linkUrl, notes: noteText, form });
      showToast('Preview ready');
    } catch (err) {
      slot.innerHTML = duplicateBanner(err) || '';
      attachDuplicateActions(slot);
      showToast(err.message, 'error');
    } finally {
      loading.stop();
      setBusy(button, false);
    }
  });
}

function duplicateBanner(err) {
  if (err.status !== 409) return '';
  const id = err.data?.existingItem?.id;
  return `
    <section class="notice">
      <strong>Already saved</strong>
      <p>This looks like something already in your library.</p>
      ${id ? `<button class="btn btn-secondary" type="button" data-duplicate-id="${escapeHtml(id)}">Open existing</button>` : ''}
    </section>
  `;
}

function attachDuplicateActions(slot) {
  slot.querySelectorAll('[data-duplicate-id]').forEach((button) => {
    button.addEventListener('click', () => navigate(`#item/${button.dataset.duplicateId}`));
  });
}

function renderPreview(slot, preview, original) {
  slot.innerHTML = `
    <section class="preview-card">
      ${preview.thumbnail_url ? `<img src="${escapeHtml(preview.thumbnail_url)}" alt="" />` : '<div class="preview-card__placeholder">Preview</div>'}
      <div class="preview-card__body">
        <span class="type-badge">${escapeHtml(preview.content_type || 'other')}</span>
        <h2 contenteditable="false" data-edit="title">${escapeHtml(preview.title)}</h2>
        <p contenteditable="false" data-edit="summary">${escapeHtml(preview.summary)}</p>
        <div class="chip-line"><span class="category-chip">${escapeHtml(preview.category)}</span><span>${formatConfidence(preview.confidence)}</span></div>
        ${tagRow(preview.tags || [])}
        <label class="inline-edit hidden">Notes<textarea data-edit="notes" rows="4">${escapeHtml(original.notes || '')}</textarea></label>
        <button class="btn btn-save btn-block" type="button" data-save>Save to Library</button>
        <button class="btn btn-secondary btn-block" type="button" data-toggle-edit>Edit details before saving</button>
      </div>
    </section>
  `;

  slot.querySelector('[data-toggle-edit]').addEventListener('click', () => {
    slot.querySelectorAll('[contenteditable]').forEach((el) => {
      el.contentEditable = 'true';
      el.classList.add('editable');
    });
    slot.querySelector('.inline-edit').classList.remove('hidden');
  });

  slot.querySelector('[data-save]').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    setBusy(button, true, 'Saving');
    const title = slot.querySelector('[data-edit="title"]').textContent.trim();
    const summary = slot.querySelector('[data-edit="summary"]').textContent.trim();
    const editedNotes = slot.querySelector('[data-edit="notes"]')?.value ?? original.notes;

    try {
      const res = await api.saveContent({
        reelUrl: original.reelUrl,
        linkUrl: original.linkUrl,
        notes: editedNotes,
        title,
        summary,
      });
      showToast('Saved');
      original.form.reset();
      slot.innerHTML = `
        <section class="notice success">
          <strong>Saved!</strong>
          <div class="notice-actions">
            <button class="btn btn-secondary" type="button" data-add>Add another</button>
            <button class="btn btn-primary" type="button" data-view>View in Library</button>
          </div>
        </section>
      `;
      slot.querySelector('[data-add]').addEventListener('click', () => {
        slot.innerHTML = '';
        original.form.elements.reelUrl.focus();
      });
      slot.querySelector('[data-view]').addEventListener('click', () => navigate(`#item/${res.item.id}`));
    } catch (err) {
      slot.insertAdjacentHTML('afterbegin', duplicateBanner(err));
      attachDuplicateActions(slot);
      showToast(err.message, 'error');
      setBusy(button, false);
    }
  });
}
