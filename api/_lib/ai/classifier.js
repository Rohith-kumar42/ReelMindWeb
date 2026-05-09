const CONTENT_TYPES = ['tool', 'course', 'repo', 'resource', 'framework', 'extension', 'other']

function heuristicClassify(context = '') {
  const text = context.toLowerCase()
  const matches = [
    ['repo', ['github', 'repository', 'open source', 'npm install', 'clone']],
    ['course', ['course', 'lesson', 'tutorial', 'learn', 'masterclass', 'bootcamp']],
    ['tool', ['tool', 'app', 'software', 'platform', 'automation', 'workflow']],
    ['framework', ['framework', 'library', 'sdk', 'api', 'starter']],
    ['extension', ['extension', 'plugin', 'browser add-on', 'chrome web store']],
    ['resource', ['guide', 'article', 'resource', 'template', 'checklist']],
  ]

  const [contentType] = matches.find(([, words]) => words.some((w) => text.includes(w))) || ['other']
  const category = text.includes('ai') || text.includes('llm') ? 'AI'
    : text.includes('design') ? 'Design'
    : text.includes('marketing') ? 'Marketing'
    : text.includes('code') || text.includes('developer') ? 'Development'
    : 'Resources'

  const tags = Array.from(new Set([
    contentType !== 'other' ? contentType : null,
    ...['ai', 'design', 'marketing', 'automation', 'developer', 'video', 'product']
      .filter((tag) => text.includes(tag)),
  ].filter(Boolean))).slice(0, 6)

  return {
    category,
    subcategory: contentType === 'other' ? 'General' : contentType[0].toUpperCase() + contentType.slice(1),
    content_type: CONTENT_TYPES.includes(contentType) ? contentType : 'other',
    tags: tags.length ? tags : ['resource'],
    confidence: 0.62,
  }
}

function safeJson(text) {
  const trimmed = text.trim()
  try { return JSON.parse(trimmed) } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found in response')
    return JSON.parse(match[0])
  }
}

export async function classifyContent(context) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('nvapi-')) {
    return heuristicClassify(context)
  }

  const prompt = `You are an AI knowledge classifier for a personal learning library called ReelMind. Users save Instagram Reels about AI tools, coding resources, courses, and tech.

Classify this saved content. Return ONLY JSON — no markdown, no explanation, no code fences.

CATEGORIES (use the exact name from this list):
- Claude Code & Skills
- AI Tools
- Learning & Courses
- Prompt Engineering
- MCP & Agents
- Developer Tools
- Freelancing
- AI Models
- Security

INPUT:
${context}

Return ONLY this JSON:
{
  "title": "Clean 5-8 word title describing the tool or resource",
  "summary": "One sentence describing what this is and why it's valuable",
  "category": "Exact category name from the list above",
  "subcategory": null,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content_type": "tool",
  "confidence": 0.88
}

content_type must be one of: tool, course, repo, resource, framework, extension, other`

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Nvidia API Error:', data)
      return heuristicClassify(context)
    }

    const text = data.choices[0]?.message?.content || ''
    const result = safeJson(text)
    return {
      title: result.title,
      summary: result.summary,
      category: String(result.category || 'AI Tools'),
      subcategory: String(result.subcategory || 'General'),
      content_type: CONTENT_TYPES.includes(result.content_type) ? result.content_type : 'other',
      tags: Array.isArray(result.tags) ? result.tags.map(String).slice(0, 10) : [],
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.8)),
    }
  } catch (err) {
    console.error('Classification error:', err)
    return heuristicClassify(context)
  }
}
