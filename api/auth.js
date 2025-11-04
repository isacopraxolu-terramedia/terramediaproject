export default async function handler(req, res) {
  // consenti CMS da questi domini
  const allowed = new Set([
    'https://terramediaproject.it',
    'https://www.terramediaproject.it',
    'https://terramediaproject.vercel.app'
  ]);
  const origin = req.headers.origin || '';
  if (allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.query || {};
  if (!code) {
    res.status(400).json({ error: 'Missing ?code from GitHub OAuth' });
    return;
  }

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const data = await r.json();

    if (data.error) {
      res.status(400).json({ error: data.error_description || data.error || 'OAuth error' });
      return;
    }

    // formato atteso da Decap CMS
    res.status(200).json({ token: data.access_token });
  } catch (e) {
    res.status(500).json({ error: 'OAuth exchange failed', details: String(e) });
  }
}

