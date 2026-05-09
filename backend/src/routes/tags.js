const express = require('express');
const { supabase } = require('../db/supabase');
const localData = require('../db/localData');
const { asyncHandler, normalizeList } = require('./utils');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  if (!supabase) {
    const tags = await localData.tags();
    return res.json({ tags });
  }

  const { data, error } = await supabase
    .from('content_items')
    .select('tags')
    .eq('user_id', req.user.id);

  if (error) throw error;

  const counts = new Map();
  for (const item of normalizeList(data)) {
    for (const tag of item.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  const tags = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  res.json({ tags });
}));

module.exports = router;
