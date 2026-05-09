const VECTOR_SIZE = 1536;

function fallbackEmbedding(text = '') {
  const vector = Array(VECTOR_SIZE).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const index = i % VECTOR_SIZE;
    vector[index] += ((text.charCodeAt(i) % 31) - 15) / 1000;
  }
  return vector;
}

async function generateEmbedding(context, inputType = 'passage') {
  if (!process.env.OPENAI_API_KEY) return fallbackEmbedding(context);

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nvidia/nv-embedqa-e5-v5',
        input: [context.slice(0, 24000)],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn(`Nvidia Embeddings API Error: ${JSON.stringify(data)}`);
      return fallbackEmbedding(context);
    }

    return data.data[0].embedding;
  } catch (err) {
    console.warn(`Nvidia Embeddings Failed: ${err.message}`);
    return fallbackEmbedding(context);
  }
}

module.exports = {
  generateEmbedding,
  fallbackEmbedding,
};
