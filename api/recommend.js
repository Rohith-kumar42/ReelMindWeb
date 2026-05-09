import { supabaseAdmin } from './_lib/supabase.js'

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// GET /api/recommend/:id
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const urlParts = req.url.split('?')[0].split('/').filter(Boolean)
  const id = urlParts[urlParts.length - 1]

  if (!id || id === 'recommend') return res.status(400).json({ error: 'Item ID is required.' })

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    const { data: item, error: itemError } = await supabaseAdmin
      .from('content_items')
      .select('embedding')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (itemError) throw itemError
    if (!item?.embedding) return res.status(200).json({ items: [] })

    const { data, error } = await supabaseAdmin.rpc('match_content_items', {
      query_embedding: item.embedding,
      match_user_id: userId,
      match_threshold: 0.4,
      match_count: 4,
    })

    if (error) throw error
    const items = (data || []).filter((c) => c.id !== id).slice(0, 3)
    return res.status(200).json({ items })
  } catch (err) {
    console.error('[API /recommend Error]', err)
    return res.status(500).json({ error: err.message })
  }
}
