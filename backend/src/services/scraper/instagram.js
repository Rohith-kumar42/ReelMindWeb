const { scrapeLink } = require('./link');

async function scrapeInstagram(reelUrl) {
  const token = process.env.INSTAGRAM_APP_TOKEN;
  if (!token) return scrapeLink(reelUrl);

  try {
    const endpoint = new URL('https://graph.facebook.com/v18.0/instagram_oembed');
    endpoint.searchParams.set('url', reelUrl);
    endpoint.searchParams.set('access_token', token);

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Instagram oEmbed failed with HTTP ${res.status}`);
    const data = await res.json();

    return {
      url: reelUrl,
      title: data.title || 'Instagram reel',
      caption: data.title || '',
      description: data.title || '',
      thumbnail_url: data.thumbnail_url || '',
      author_name: data.author_name || '',
      provider_name: data.provider_name || 'Instagram',
    };
  } catch (err) {
    return scrapeLink(reelUrl);
  }
}

module.exports = {
  scrapeInstagram,
};
