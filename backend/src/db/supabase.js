const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function requireSupabase() {
  if (!supabase) {
    const err = new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env.');
    err.status = 503;
    throw err;
  }
  return supabase;
}

module.exports = {
  supabase,
  requireSupabase,
  isConfigured: Boolean(supabase),
};
