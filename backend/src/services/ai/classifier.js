const CONTENT_TYPES = ['tool', 'course', 'repo', 'resource', 'framework', 'extension', 'other'];

function heuristicClassify(context = '') {
  const text = context.toLowerCase();
  const matches = [
    ['repo', ['github', 'repository', 'open source', 'npm install', 'clone']],
    ['course', ['course', 'lesson', 'tutorial', 'learn', 'masterclass', 'bootcamp']],
    ['tool', ['tool', 'app', 'software', 'platform', 'automation', 'workflow']],
    ['framework', ['framework', 'library', 'sdk', 'api', 'starter']],
    ['extension', ['extension', 'plugin', 'browser add-on', 'chrome web store']],
    ['resource', ['guide', 'article', 'resource', 'template', 'checklist']],
  ];

  const [contentType] = matches.find(([, words]) => words.some((word) => text.includes(word))) || ['other'];
  const category = text.includes('ai') || text.includes('llm') ? 'AI'
    : text.includes('design') ? 'Design'
    : text.includes('marketing') ? 'Marketing'
    : text.includes('code') || text.includes('developer') ? 'Development'
    : 'Resources';

  const tags = Array.from(new Set([
    contentType !== 'other' ? contentType : null,
    ...['ai', 'design', 'marketing', 'automation', 'developer', 'video', 'product']
      .filter((tag) => text.includes(tag)),
  ].filter(Boolean))).slice(0, 6);

  return {
    category,
    subcategory: contentType === 'other' ? 'General' : contentType[0].toUpperCase() + contentType.slice(1),
    content_type: CONTENT_TYPES.includes(contentType) ? contentType : 'other',
    tags: tags.length ? tags : ['resource'],
    confidence: 0.62,
  };
}

function safeJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw err;
    return JSON.parse(match[0]);
  }
}

async function classifyContent(context) {
  if (!process.env.ANTHROPIC_API_KEY) return heuristicClassify(context);

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    temperature: 0,
    messages: [{
      role: 'user',
      content: `Classify this content. Return JSON only:
{ category, subcategory, content_type, tags: string[], confidence: 0-1 }
content_type must be one of: tool, course, repo, resource, framework, extension, other
Content: ${context}`,
    }],
  });

  const text = response.content.map((part) => part.text || '').join('');
  const result = safeJson(text);
  return {
    category: String(result.category || 'Resources'),
    subcategory: String(result.subcategory || 'General'),
    content_type: CONTENT_TYPES.includes(result.content_type) ? result.content_type : 'other',
    tags: Array.isArray(result.tags) ? result.tags.map(String).slice(0, 10) : [],
    confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5)),
  };
}

module.exports = {
  classifyContent,
  heuristicClassify,
};
