// Vercel serverless function — proxies OpenRouter chat completions.
// The API key lives in the Vercel env var OPENROUTER_API_KEY and never
// reaches the client. The static gh-pages app calls this endpoint.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Server missing OPENROUTER_API_KEY' });
    return;
  }

  try {
    const { messages, temperature = 0.8 } = req.body ?? {};
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' });
      return;
    }

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://debaprasad-dez.github.io/cineOne/',
        'X-Title': 'CinemaOne',
      },
      body: JSON.stringify({ model: MODEL, messages, temperature }),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Proxy error', detail: String(e) });
  }
}
