import { supabaseAdmin } from './_lib/supabase.js'

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// GET /api/categories
// POST /api/categories
// PATCH /api/categories/:id
// DELETE /api/categories/:id
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const urlParts = req.url.split('?')[0].split('/').filter(Boolean)
  const id = urlParts.length > 2 ? urlParts[urlParts.length - 1] : null

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    // ── GET /api/categories ───────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*, content_items(count)')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error

      const categories = (data || []).map((cat) => ({
        ...cat,
        item_count: cat.content_items?.[0]?.count || 0,
      }))
      return res.status(200).json({ categories })
    }

    // ── POST /api/categories ──────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { name, color = '#4442a8', icon = 'bookmark' } = req.body
      if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' })

      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({ user_id: userId, name: name.trim(), color, icon })
        .select('*')
        .single()

      if (error) throw error
      return res.status(201).json({ category: data })
    }

    // ── PATCH /api/categories/:id ─────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const allowed = ['name', 'color', 'icon']
      const update = {}
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) update[key] = req.body[key]
      }

      const { data, error } = await supabaseAdmin
        .from('categories')
        .update(update)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) throw error
      return res.status(200).json({ category: data })
    }

    // ── DELETE /api/categories/:id ────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[API /categories Error]', err)
    return res.status(err.status || 500).json({ error: err.message })
  }
}
