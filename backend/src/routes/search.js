const express = require('express');
const { supabase } = require('../db/supabase');
const localData = require('../db/localData');
const { generateEmbedding } = require('../services/ai/embedder');
const { asyncHandler, normalizeList } = require('./utils');

const router = express.Router();

const FALLBACK_SUGGESTIONS = [
  'AI video tools',
  'design inspiration',
  'developer resources',
  'marketing automation',
  'useful frameworks',
  'saved courses',
];

router.post('/', asyncHandler(async (req, res) => {
  const query = String(req.body.query || '').trim();
  if (!query) return res.json({ items: [] });
  if (!supabase) {
    const items = await localData.searchContent(query);
    return res.json({ items });
  }

  const embedding = await generateEmbedding(query, 'query');
  const { data, error } = await supabase.rpc('match_content_items', {
    query_embedding: embedding,
    match_user_id: req.user.id,
    match_threshold: 0.35,
    match_count: 25,
  });

  if (error) throw error;
  res.json({ items: normalizeList(data) });
}));

router.get('/suggestions', asyncHandler(async (req, res) => {
  if (!supabase) {
    const suggestions = await localData.suggestions();
    return res.json({ suggestions: suggestions.length ? suggestions : FALLBACK_SUGGESTIONS });
  }

  const { data, error } = await supabase
    .from('content_items')
    .select('tags')
    .eq('user_id', req.user.id)
    .limit(50);

  if (error) return res.json({ suggestions: FALLBACK_SUGGESTIONS });
  const suggestions = Array.from(new Set(normalizeList(data).flatMap((item) => item.tags || [])))
    .filter(Boolean)
    .slice(0, 8);

  res.json({ suggestions: suggestions.length ? suggestions : FALLBACK_SUGGESTIONS });
}));

module.exports = router;
