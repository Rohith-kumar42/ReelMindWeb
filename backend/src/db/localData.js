const fs = require('fs/promises');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../../../database/data.json');

async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    items: Array.isArray(data.items) ? data.items : [],
  };
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function toApiCategory(category, itemCount = 0) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    color: category.color,
    icon: category.icon,
    created_at: category.createdAt || category.created_at,
    item_count: itemCount,
  };
}

function toApiItem(item, categoriesById = new Map()) {
  const category = categoriesById.get(item.categoryId || item.category_id);
  return {
    id: item.id,
    reel_url: item.reelUrl || item.reel_url || null,
    link_url: item.linkUrl || item.link_url || null,
    notes: item.notes || '',
    title: item.title || 'Untitled save',
    summary: item.summary || '',
    category_id: item.categoryId || item.category_id || null,
    subcategory: item.subcategory || null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    content_type: item.contentType || item.content_type || 'other',
    is_favorite: Boolean(item.isFavorite ?? item.is_favorite),
    confidence: Number(item.aiConfidence ?? item.confidence ?? 0),
    sort_order: Number(item.sortOrder ?? item.sort_order ?? 0),
    created_at: item.createdAt || item.created_at || null,
    updated_at: item.updatedAt || item.updated_at || null,
    categories: category ? toApiCategory(category) : null,
  };
}

function fromApiUpdate(update) {
  const mapped = {};
  if (Object.prototype.hasOwnProperty.call(update, 'title')) mapped.title = update.title;
  if (Object.prototype.hasOwnProperty.call(update, 'summary')) mapped.summary = update.summary;
  if (Object.prototype.hasOwnProperty.call(update, 'notes')) mapped.notes = update.notes;
  if (Object.prototype.hasOwnProperty.call(update, 'is_favorite')) mapped.isFavorite = update.is_favorite;
  mapped.updatedAt = new Date().toISOString();
  return mapped;
}

function categoriesById(categories) {
  return new Map(categories.map((category) => [category.id, category]));
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.sortOrder ?? 0);
    const orderB = Number(b.sortOrder ?? 0);
    if (orderA !== orderB) return orderA - orderB;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

async function listCategories() {
  const data = await readData();
  const counts = new Map();
  data.items.forEach((item) => {
    const id = item.categoryId || item.category_id;
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  return data.categories.map((category) => toApiCategory(category, counts.get(category.id) || 0));
}

async function createCategory({ name, color = '#4442a8', icon = 'bookmark' }) {
  const data = await readData();
  const category = {
    id: `cat-${Date.now().toString(36)}`,
    name: name.trim(),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    color,
    icon,
    createdAt: new Date().toISOString(),
  };
  data.categories.push(category);
  await writeData(data);
  return toApiCategory(category, 0);
}

async function updateCategory(id, update) {
  const data = await readData();
  const index = data.categories.findIndex((category) => category.id === id);
  if (index === -1) return null;
  data.categories[index] = { ...data.categories[index], ...update };
  await writeData(data);
  return toApiCategory(data.categories[index]);
}

async function deleteCategory(id) {
  const data = await readData();
  data.categories = data.categories.filter((category) => category.id !== id);
  data.items = data.items.map((item) => item.categoryId === id ? { ...item, categoryId: null } : item);
  await writeData(data);
}

async function listContent({ category_id, content_type, limit = 50, offset = 0 } = {}) {
  const data = await readData();
  const categoryMap = categoriesById(data.categories);
  let items = sortItems(data.items);
  if (category_id) items = items.filter((item) => (item.categoryId || item.category_id) === category_id);
  if (content_type) items = items.filter((item) => (item.contentType || item.content_type) === content_type);
  const total = items.length;
  const paged = items.slice(offset, offset + limit).map((item) => toApiItem(item, categoryMap));
  return { items: paged, total };
}

async function getContent(id) {
  const data = await readData();
  const item = data.items.find((candidate) => candidate.id === id);
  if (!item) return null;
  return toApiItem(item, categoriesById(data.categories));
}

async function updateContent(id, update) {
  const data = await readData();
  const index = data.items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  data.items[index] = { ...data.items[index], ...fromApiUpdate(update) };
  await writeData(data);
  return toApiItem(data.items[index], categoriesById(data.categories));
}

async function deleteContent(id) {
  const data = await readData();
  data.items = data.items.filter((item) => item.id !== id);
  await writeData(data);
}

async function createContentFromPreview(preview, body = {}) {
  const data = await readData();
  let category = data.categories.find((candidate) => candidate.name.toLowerCase() === String(preview.category || '').toLowerCase());
  if (!category) {
    category = {
      id: `cat-${Date.now().toString(36)}`,
      name: preview.category || 'Resources',
      slug: String(preview.category || 'resources').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      color: '#4442a8',
      icon: 'bookmark',
      createdAt: new Date().toISOString(),
    };
    data.categories.push(category);
  }

  const now = new Date().toISOString();
  const item = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reelUrl: body.reelUrl,
    linkUrl: body.linkUrl || null,
    notes: body.notes || '',
    title: body.title || preview.title,
    summary: body.summary || preview.summary,
    categoryId: category.id,
    subcategory: preview.subcategory || null,
    tags: preview.tags || [],
    contentType: preview.content_type || 'other',
    isFavorite: false,
    aiConfidence: preview.confidence || 0,
    sortOrder: data.items.length,
    createdAt: now,
    updatedAt: now,
  };

  data.items.unshift(item);
  await writeData(data);
  return toApiItem(item, categoriesById(data.categories));
}

async function searchContent(query) {
  const needle = query.toLowerCase();
  const data = await readData();
  const categoryMap = categoriesById(data.categories);
  return sortItems(data.items)
    .filter((item) => [
      item.title,
      item.summary,
      item.notes,
      item.contentType,
      ...(item.tags || []),
    ].filter(Boolean).join(' ').toLowerCase().includes(needle))
    .slice(0, 25)
    .map((item) => toApiItem(item, categoryMap));
}

async function suggestions() {
  const data = await readData();
  return Array.from(new Set(data.items.flatMap((item) => item.tags || [])))
    .filter(Boolean)
    .slice(0, 10);
}

async function tags() {
  const data = await readData();
  const counts = new Map();
  data.items.forEach((item) => {
    (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function recommend(id) {
  const data = await readData();
  const current = data.items.find((item) => item.id === id);
  if (!current) return [];
  const categoryMap = categoriesById(data.categories);
  const currentTags = new Set(current.tags || []);
  return sortItems(data.items)
    .filter((item) => item.id !== id)
    .map((item) => ({
      item,
      score: (item.categoryId === current.categoryId ? 3 : 0)
        + (item.tags || []).filter((tag) => currentTags.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => toApiItem(entry.item, categoryMap));
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listContent,
  getContent,
  updateContent,
  deleteContent,
  createContentFromPreview,
  searchContent,
  suggestions,
  tags,
  recommend,
};
