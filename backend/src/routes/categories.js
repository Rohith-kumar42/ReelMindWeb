const express = require('express');
const { requireSupabase, supabase } = require('../db/supabase');
const localData = require('../db/localData');
const { asyncHandler, normalizeList } = require('./utils');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  if (!supabase) {
    const categories = await localData.listCategories();
    return res.json({ categories });
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*, content_items(count)')
    .eq('user_id', req.user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  const categories = normalizeList(data).map((category) => ({
    ...category,
    item_count: category.content_items?.[0]?.count || 0,
  }));
  res.json({ categories });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, color = '#4442a8', icon = 'bookmark' } = req.body;
  if (!name?.trim()) {
    const err = new Error('Category name is required.');
    err.status = 400;
    throw err;
  }

  if (!supabase) {
    const category = await localData.createCategory({ name, color, icon });
    return res.status(201).json({ category });
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .insert({ user_id: req.user.id, name: name.trim(), color, icon })
    .select('*')
    .single();

  if (error) throw error;
  res.status(201).json({ category: data });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'color', 'icon'];
  const update = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) update[key] = req.body[key];
  }

  if (!supabase) {
    const category = await localData.updateCategory(req.params.id, update);
    if (!category) {
      const err = new Error('Category not found.');
      err.status = 404;
      throw err;
    }
    return res.json({ category });
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .update(update)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ category: data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!supabase) {
    await localData.deleteCategory(req.params.id);
    return res.json({ ok: true });
  }

  const client = requireSupabase();
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) throw error;
  res.json({ ok: true });
}));

module.exports = router;
