import { supabaseAdmin } from './_lib/supabase.js'

function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// GET /api/tags
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    const { data, error } = await supabaseAdmin
      .from('content_items')
      .select('tags')
      .eq('user_id', userId)

    if (error) throw error

    const counts = new Map()
    for (const item of data || []) {
      for (const tag of item.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
    }

    const tags = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return res.status(200).json({ tags })
  } catch (err) {
    console.error('[API /tags Error]', err)
    return res.status(500).json({ error: err.message })
  }
}
