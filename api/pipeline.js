function setCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// POST /api/pipeline/preview
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
  const userId = DEV_USER_ID

  try {
    const { runPipeline, DuplicateContentError } = await import('./_lib/pipeline.js')
    try {
      const result = await runPipeline({
        reelUrl: req.body.reelUrl,
        linkUrl: req.body.linkUrl,
        notes: req.body.notes,
        save: false,
        userId,
      })
      return res.status(200).json({ preview: result.preview })
    } catch (err) {
      if (err.code === 'DUPLICATE_CONTENT') {
        return res.status(409).json({ message: 'Already saved', existingItem: err.existingItem })
      }
      throw err
    }
  } catch (err) {
    console.error('[API /pipeline Error]', err)
    return res.status(err.status || 500).json({ error: err.message })
  }
}
