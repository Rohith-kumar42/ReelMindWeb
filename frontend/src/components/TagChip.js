import { escapeHtml } from './dom.js';

export function tagChip(tag) {
  return `<span class="tag-chip">${escapeHtml(tag)}</span>`;
}

export function tagRow(tags = []) {
  if (!tags.length) return '';
  return `<div class="tag-row">${tags.slice(0, 4).map(tagChip).join('')}</div>`;
}
