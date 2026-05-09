// All API calls go through /api/* — resolves to Vercel serverless functions in
// production and to the Vite dev proxy (localhost:3001) in local dev.
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function cleanParams(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  return search.toString()
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  // Content
  getContent: (params = {}) => {
    const query = cleanParams(params)
    return request(`/content${query ? `?${query}` : ''}`)
  },
  getItem: (id) => request(`/content/${id}`),
  saveContent: (body) => request('/content', { method: 'POST', body }),
  updateItem: (id, body) => request(`/content/${id}`, { method: 'PATCH', body }),
  deleteItem: (id) => request(`/content/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Search
  search: (query) => request('/search', { method: 'POST', body: { query } }),
  getSuggestions: () => request('/search/suggestions'),

  // Pipeline
  preview: (body) => request('/pipeline/preview', { method: 'POST', body }),

  // Recommend & Tags
  recommend: (id) => request(`/recommend/${id}`),
  getTags: () => request('/tags'),
}
