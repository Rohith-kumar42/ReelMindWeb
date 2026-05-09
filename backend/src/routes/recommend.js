const express = require('express');
const { supabase, requireSupabase } = require('../db/supabase');
const localData = require('../db/localData');
const { asyncHandler, normalizeList } = require('./utils');

const router = express.Router();

router.get('/:id', asyncHandler(async (req, res) => {
  if (!supabase) {
    const items = await localData.recommend(req.params.id);
    return res.json({ items });
  }
  const client = requireSupabase();

  const { data: item, error: itemError } = await client
    .from('content_items')
    .select('embedding')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (itemError) throw itemError;
  if (!item?.embedding) return res.json({ items: [] });

  const { data, error } = await client.rpc('match_content_items', {
    query_embedding: item.embedding,
    match_user_id: req.user.id,
    match_threshold: 0.4,
    match_count: 4,
  });

  if (error) throw error;
  const items = normalizeList(data).filter((candidate) => candidate.id !== req.params.id).slice(0, 3);
  res.json({ items });
}));

module.exports = router;
