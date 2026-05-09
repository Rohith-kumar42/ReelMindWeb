import { escapeHtml, setBusy } from './dom.js';

export function confirmDialog({ title, body, confirmLabel = 'Delete', onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <section class="confirm-dialog" role="dialog" aria-modal="true">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary" type="button" data-close>Cancel</button>
        <button class="btn btn-danger" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    </section>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close]')) close();
  });
  overlay.querySelector('[data-confirm]').addEventListener('click', async (event) => {
    setBusy(event.currentTarget, true, 'Deleting');
    await onConfirm();
    close();
  });

  document.body.append(overlay);
}

export function editSheet({ item, onSave }) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <form class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle" aria-hidden="true"></div>
      <h2>Edit details</h2>
      <label>Title<input name="title" value="${escapeHtml(item.title || '')}" /></label>
      <label>Summary<textarea name="summary" rows="4">${escapeHtml(item.summary || '')}</textarea></label>
      <label>Notes<textarea name="notes" rows="5">${escapeHtml(item.notes || '')}</textarea></label>
      <div class="dialog-actions">
        <button class="btn btn-secondary" type="button" data-close>Cancel</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `;

  const close = () => overlay.remove();
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.querySelector('.sheet').classList.add('open'));

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close]')) close();
  });
  overlay.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = overlay.querySelector('[type="submit"]');
    const form = new FormData(event.currentTarget);
    setBusy(button, true, 'Saving');
    await onSave({
      title: form.get('title'),
      summary: form.get('summary'),
      notes: form.get('notes'),
    });
    close();
  });
}
