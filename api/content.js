import { supabaseAdmin } from './_lib/supabase.js'

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function clamp(val, def, min, max) {
  const n = parseInt(val, 10)
  return isNaN(n) ? def : Math.min(max, Math.max(min, n))
}

// GET /api/content, GET /api/content/:id, POST /api/content,
// PATCH /api/content/:id, DELETE /api/content/:id
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Derive resource ID from the URL — Vercel passes it in the query when using
  // a catch-all rewrite, but the function file handles /api/content/* via the
  // path segment after 'content'.
  const urlParts = req.url.split('?')[0].split('/').filter(Boolean)
  // urlParts: ['api', 'content'] or ['api', 'content', '<id>']
  const id = urlParts.length > 2 ? urlParts[urlParts.length - 1] : null

  // Hardcoded dev user so the app works without Supabase Auth in the first deploy.
  // Replace this with real auth (e.g. verify JWT from Authorization header) in production.
  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    // ── GET /api/content/:id ──────────────────────────────────────────────────
    if (req.method === 'GET' && id) {
      const { data, error } = await supabaseAdmin
        .from('content_items')
        .select('*, categories(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      const viewCount = Number(data.view_count || 0) + 1
      await supabaseAdmin
        .from('content_items')
        .update({ view_count: viewCount })
        .eq('id', id)
        .eq('user_id', userId)

      return res.status(200).json({ item: { ...data, view_count: viewCount } })
    }

    // ── GET /api/content ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const limit = clamp(req.query.limit, 50, 1, 200)
      const offset = clamp(req.query.offset, 0, 0, 100000)

      let query = supabaseAdmin
        .from('content_items')
        .select('*, categories(*)', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (req.query.category_id) query = query.eq('category_id', req.query.category_id)
      if (req.query.content_type) query = query.eq('content_type', req.query.content_type)

      const { data, error, count } = await query
      if (error) throw error
      return res.status(200).json({ items: data || [], total: count || 0 })
    }

    // ── POST /api/content ─────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { runPipeline, DuplicateContentError } = await import('./_lib/pipeline.js')
      try {
        const result = await runPipeline({
          reelUrl: req.body.reelUrl,
          linkUrl: req.body.linkUrl,
          notes: req.body.notes,
          title: req.body.title,
          summary: req.body.summary,
          save: true,
          userId,
        })
        return res.status(201).json({ item: result.item })
      } catch (err) {
        if (err.code === 'DUPLICATE_CONTENT') {
          return res.status(409).json({ message: 'Already saved', existingItem: err.existingItem })
        }
        throw err
      }
    }

    // ── PATCH /api/content/:id ────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const allowed = ['title', 'summary', 'notes', 'is_favorite']
      const update = {}
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) update[key] = req.body[key]
      }
      if (!Object.keys(update).length) {
        return res.status(400).json({ error: 'No valid fields to update.' })
      }

      const { data, error } = await supabaseAdmin
        .from('content_items')
        .update(update)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, categories(*)')
        .single()

      if (error) throw error
      return res.status(200).json({ item: data })
    }

    // ── DELETE /api/content/:id ───────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      const { error } = await supabaseAdmin
        .from('content_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[API /content Error]', err)
    return res.status(err.status || 500).json({ error: err.message })
  }
}
