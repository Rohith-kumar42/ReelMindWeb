const VECTOR_SIZE = 1536

function fallbackEmbedding(text = '') {
  const vector = Array(VECTOR_SIZE).fill(0)
  for (let i = 0; i < text.length; i++) {
    const index = i % VECTOR_SIZE
    vector[index] += ((text.charCodeAt(i) % 31) - 15) / 1000
  }
  return vector
}

export async function generateEmbedding(context) {
  const isNvidia = process.env.OPENAI_API_KEY?.startsWith('nvapi-') || process.env.NVIDIA_API_KEY
  const isOpenAI = process.env.OPENAI_API_KEY?.startsWith('sk-')

  if (!isNvidia && !isOpenAI) return fallbackEmbedding(context)

  try {
    let url, headers, body

    if (isOpenAI) {
      url = 'https://api.openai.com/v1/embeddings'
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      }
      body = JSON.stringify({
        model: 'text-embedding-3-small',
        input: context.slice(0, 8000), // OpenAI limit is higher but 8k is safe
      })
    } else {
      url = 'https://integrate.api.nvidia.com/v1/embeddings'
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY}`,
      }
      body = JSON.stringify({
        model: 'nvidia/nv-embedqa-e5-v5',
        input: [context.slice(0, 24000)],
      })
    }

    const response = await fetch(url, { method: 'POST', headers, body })
    const data = await response.json()

    if (!response.ok) {
      console.warn(`AI Embeddings API Error: ${JSON.stringify(data)}`)
      return fallbackEmbedding(context)
    }

    return isOpenAI ? data.data[0].embedding : data.data[0].embedding
  } catch (err) {
    console.warn(`AI Embeddings Failed: ${err.message}`)
    return fallbackEmbedding(context)
  }
}
