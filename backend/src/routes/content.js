const express = require('express');
const { requireSupabase, supabase } = require('../db/supabase');
const localData = require('../db/localData');
const { runPipeline } = require('../services/pipeline');
const { asyncHandler, clampNumber, normalizeList } = require('./utils');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const limit = clampNumber(req.query.limit, 50, 1, 200);
  const offset = clampNumber(req.query.offset, 0, 0, 100000);

  if (!supabase) {
    const result = await localData.listContent({
      category_id: req.query.category_id,
      content_type: req.query.content_type,
      limit,
      offset,
    });
    return res.json(result);
  }

  let query = supabase
    .from('content_items')
    .select('*, categories(*)', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (req.query.category_id) query = query.eq('category_id', req.query.category_id);
  if (req.query.content_type) query = query.eq('content_type', req.query.content_type);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ items: normalizeList(data), total: count || 0 });
}));

router.post('/', asyncHandler(async (req, res) => {
  if (!supabase) {
    const result = await runPipeline({
      reelUrl: req.body.reelUrl,
      linkUrl: req.body.linkUrl,
      notes: req.body.notes,
      title: req.body.title,
      summary: req.body.summary,
      save: false,
      userId: req.user.id,
    });
    const item = await localData.createContentFromPreview(result.preview, req.body);
    return res.status(201).json({ item });
  }

  const result = await runPipeline({
    reelUrl: req.body.reelUrl,
    linkUrl: req.body.linkUrl,
    notes: req.body.notes,
    title: req.body.title,
    summary: req.body.summary,
    save: true,
    userId: req.user.id,
  });

  res.status(201).json({ item: result.item });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!supabase) {
    const item = await localData.getContent(req.params.id);
    if (!item) {
      const err = new Error('Content item not found.');
      err.status = 404;
      throw err;
    }
    return res.json({ item });
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('content_items')
    .select('*, categories(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error) throw error;

  const viewCount = Number(data.view_count || 0) + 1;
  await client
    .from('content_items')
    .update({ view_count: viewCount })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  res.json({ item: { ...data, view_count: viewCount } });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['title', 'summary', 'notes', 'is_favorite'];
  const update = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) update[key] = req.body[key];
  }

  if (!Object.keys(update).length) {
    const err = new Error('No valid fields to update.');
    err.status = 400;
    throw err;
  }

  if (!supabase) {
    const item = await localData.updateContent(req.params.id, update);
    if (!item) {
      const err = new Error('Content item not found.');
      err.status = 404;
      throw err;
    }
    return res.json({ item });
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('content_items')
    .update(update)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select('*, categories(*)')
    .single();

  if (error) throw error;
  res.json({ item: data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!supabase) {
    await localData.deleteContent(req.params.id);
    return res.json({ ok: true });
  }

  const client = requireSupabase();
  const { error } = await client
    .from('content_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) throw error;
  res.json({ ok: true });
}));

module.exports = router;
