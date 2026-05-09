const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 ReelMind/1.0'

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }
  return ''
}

function pickMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return firstMatch(html, [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ])
}

function parseHtml(html, url) {
  const title = pickMeta(html, 'og:title')
    || pickMeta(html, 'twitter:title')
    || firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i, /<h1[^>]*>([\s\S]*?)<\/h1>/i])
  const description = pickMeta(html, 'og:description')
    || pickMeta(html, 'twitter:description')
    || pickMeta(html, 'description')
  const thumbnailUrl = pickMeta(html, 'og:image') || pickMeta(html, 'twitter:image')

  return {
    url,
    title: title || url,
    description,
    thumbnail_url: thumbnailUrl,
    site_name: pickMeta(html, 'og:site_name'),
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Fetch failed with HTTP ${res.status}`)
  return res.text()
}

export async function scrapeLink(url) {
  if (!url) return null
  try {
    const html = await fetchHtml(url)
    const parsed = parseHtml(html, url)
    if (parsed.title || parsed.description || parsed.thumbnail_url) return parsed
  } catch { /* fall through to error result */ }

  // Playwright is NOT available in Vercel serverless functions — return a minimal result
  return {
    url,
    title: url,
    description: '',
    thumbnail_url: '',
    site_name: '',
  }
}
