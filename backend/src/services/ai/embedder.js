const VECTOR_SIZE = 1536;

function fallbackEmbedding(text = '') {
  const vector = Array(VECTOR_SIZE).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const index = i % VECTOR_SIZE;
    vector[index] += ((text.charCodeAt(i) % 31) - 15) / 1000;
  }
  return vector;
}

async function generateEmbedding(context) {
  if (!process.env.OPENAI_API_KEY) return fallbackEmbedding(context);

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: context.slice(0, 24000),
  });

  return response.data[0].embedding;
}

module.exports = {
  generateEmbedding,
  fallbackEmbedding,
};
