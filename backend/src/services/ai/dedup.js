const { supabase } = require('../../db/supabase');

async function checkDuplicate(embedding, userId, threshold = 0.95) {
  if (!supabase) return { isDuplicate: false };

  const { data, error } = await supabase.rpc('match_content_items', {
    query_embedding: embedding,
    match_user_id: userId,
    match_threshold: threshold,
    match_count: 1,
  });

  if (error) {
    return { isDuplicate: false, error: error.message };
  }

  const existingItem = Array.isArray(data) ? data[0] : data;
  if (!existingItem) return { isDuplicate: false };

  return {
    isDuplicate: true,
    existingItem,
  };
}

module.exports = {
  checkDuplicate,
};
