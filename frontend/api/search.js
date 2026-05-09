import { supabaseAdmin } from './_lib/supabase.js'
import { generateEmbedding } from './_lib/ai/embedder.js'

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const FALLBACK_SUGGESTIONS = [
  'AI video tools',
  'design inspiration',
  'developer resources',
  'marketing automation',
  'useful frameworks',
  'saved courses',
]

// POST /api/search           — semantic vector search
// GET  /api/search/suggestions — tag-based search suggestions
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const urlParts = req.url.split('?')[0].split('/').filter(Boolean)
  const isSuggestions = urlParts[urlParts.length - 1] === 'suggestions'

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    // ── GET /api/search/suggestions ───────────────────────────────────────────
    if (req.method === 'GET' && isSuggestions) {
      const { data, error } = await supabaseAdmin
        .from('content_items')
        .select('tags')
        .eq('user_id', userId)
        .limit(50)

      if (error) return res.status(200).json({ suggestions: FALLBACK_SUGGESTIONS })

      const suggestions = Array.from(new Set((data || []).flatMap((item) => item.tags || [])))
        .filter(Boolean)
        .slice(0, 8)

      return res.status(200).json({ suggestions: suggestions.length ? suggestions : FALLBACK_SUGGESTIONS })
    }

    // ── POST /api/search ──────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const query = String(req.body?.query || '').trim()
      if (!query) return res.status(200).json({ items: [] })

      const embedding = await generateEmbedding(query)
      const { data, error } = await supabaseAdmin.rpc('match_content_items', {
        query_embedding: embedding,
        match_user_id: userId,
        match_threshold: 0.35,
        match_count: 25,
      })

      if (error) throw error
      return res.status(200).json({ items: data || [] })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[API /search Error]', err)
    return res.status(500).json({ error: err.message })
  }
}
