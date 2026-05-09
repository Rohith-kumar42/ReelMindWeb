const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 ReelMindLocal/1.0';

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return '';
}

function pickMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return firstMatch(html, [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ]);
}

function parseHtml(html, url) {
  const title = pickMeta(html, 'og:title')
    || pickMeta(html, 'twitter:title')
    || firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i, /<h1[^>]*>([\s\S]*?)<\/h1>/i]);
  const description = pickMeta(html, 'og:description')
    || pickMeta(html, 'twitter:description')
    || pickMeta(html, 'description');
  const thumbnailUrl = pickMeta(html, 'og:image') || pickMeta(html, 'twitter:image');

  return {
    url,
    title: title || url,
    description,
    thumbnail_url: thumbnailUrl,
    site_name: pickMeta(html, 'og:site_name'),
  };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Fetch failed with HTTP ${res.status}`);
  return res.text();
}

async function scrapeRendered(url) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    return await page.evaluate(() => ({
      title: document.querySelector('meta[property="og:title"]')?.content
        || document.querySelector('meta[name="twitter:title"]')?.content
        || document.title
        || document.querySelector('h1')?.textContent
        || '',
      description: document.querySelector('meta[property="og:description"]')?.content
        || document.querySelector('meta[name="twitter:description"]')?.content
        || document.querySelector('meta[name="description"]')?.content
        || '',
      thumbnail_url: document.querySelector('meta[property="og:image"]')?.content
        || document.querySelector('meta[name="twitter:image"]')?.content
        || '',
      site_name: document.querySelector('meta[property="og:site_name"]')?.content || '',
    }));
  } finally {
    await browser.close();
  }
}

async function scrapeLink(url) {
  if (!url) return null;
  try {
    const html = await fetchHtml(url);
    const parsed = parseHtml(html, url);
    if (parsed.title || parsed.description || parsed.thumbnail_url) return parsed;
  } catch (err) {
    // Playwright fallback below handles fetch failures and heavily rendered pages.
  }

  try {
    const rendered = await scrapeRendered(url);
    return {
      url,
      title: rendered.title || url,
      description: rendered.description || '',
      thumbnail_url: rendered.thumbnail_url || '',
      site_name: rendered.site_name || '',
    };
  } catch (err) {
    return {
      url,
      title: url,
      description: '',
      thumbnail_url: '',
      site_name: '',
      error: err.message,
    };
  }
}

module.exports = {
  scrapeLink,
  parseHtml,
};
