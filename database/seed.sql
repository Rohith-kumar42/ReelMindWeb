-- ============================================================
-- ReelMind — Seed Data
-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor
-- ============================================================

-- Seed categories (using text IDs for readability — schema uses uuid PKs,
-- so these inserts use gen_random_uuid() unless you want fixed IDs)

insert into public.categories (name, slug, color, icon) values
  ('Claude Code & Skills', 'claude-code',        '#8B5CF6', 'code'),
  ('AI Tools',             'ai-tools',            '#06B6D4', 'cpu'),
  ('Learning & Courses',   'learning',            '#10B981', 'graduation-cap'),
  ('Prompt Engineering',   'prompt-engineering',  '#F59E0B', 'zap'),
  ('MCP & Agents',         'mcp-agents',          '#EC4899', 'bot'),
  ('Developer Tools',      'dev-tools',           '#3B82F6', 'wrench'),
  ('Freelancing',          'freelancing',         '#14B8A6', 'briefcase'),
  ('AI Models',            'ai-models',           '#EF4444', 'sparkles'),
  ('Security',             'security',            '#F97316', 'shield')
on conflict do nothing;
