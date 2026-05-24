# Connecting an AI Provider to a Static Web App via a Serverless Proxy

A generic, end-to-end recipe for safely connecting any client-side application
(React, Vue, Svelte, vanilla, static HTML, mobile webview, browser extension, etc.)
to an LLM provider — without leaking the API key into the user's browser.

The example uses **Vercel Serverless Functions** as the proxy and
**OpenRouter** as the model provider, but the same pattern works with:

- **Hosts:** Cloudflare Workers, Netlify Functions, AWS Lambda + API Gateway,
  Deno Deploy, Supabase Edge Functions, Fly.io, Render, Railway, your own Node server.
- **Providers:** OpenAI, Anthropic, Google Gemini, Mistral, Groq, Together,
  Replicate, any HTTP-based LLM API.

---

## 1. Why a proxy?

Any API key shipped to the browser is **public**:

- Bundlers (Vite, Webpack, esbuild) inline `import.meta.env.*` /
  `process.env.*` strings at build time. They appear in JS files anyone can `view-source`.
- GitHub's secret scanning and the providers themselves scan public repos and
  **auto-revoke leaked keys**. OpenRouter, OpenAI, Anthropic and AWS all do this.
- A leaked key can be drained by anyone until they hit your quota or your card.

A proxy keeps the key on a server you control. The browser calls **your** endpoint;
your endpoint forwards the request to the provider with the secret key attached.

```
[Browser]  --(no key)-->  [Your proxy]  --(secret key)-->  [LLM provider]
```

---

## 2. The proxy function

Drop the following file at the path your host expects. For **Vercel** that is
`api/<name>.js` (or `.ts`) — Vercel automatically deploys every file under `api/`
as a serverless endpoint at `/api/<name>`.

```js
// api/chat.js
// Generic LLM proxy. Forwards a chat-completions request to the provider.

const PROVIDER_URL = process.env.PROVIDER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b:free';

function setCors(res) {
  // Lock this to your real frontend origin in production, e.g.
  //   'https://your-site.example.com'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.LLM_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server missing LLM_API_KEY' });

  try {
    const { messages, temperature = 0.7, model } = req.body ?? {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const upstream = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        // Optional provider headers (OpenRouter examples):
        'HTTP-Referer': process.env.APP_URL || '',
        'X-Title': process.env.APP_NAME || 'App',
      },
      body: JSON.stringify({ model: model || MODEL, messages, temperature }),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Proxy error', detail: String(e) });
  }
}
```

### Optional: minimal `vercel.json`

```json
{
  "functions": {
    "api/chat.js": { "maxDuration": 30 }
  }
}
```

`maxDuration` raises the timeout from the 10s default — useful for slower models.
On the Vercel Hobby tier the cap is 60s; on Pro it is 300s.

### Equivalent on other hosts

The handler signature is the only thing that changes:

| Host | File path | Signature |
|---|---|---|
| Vercel | `api/chat.js` | `export default async (req, res) =>` |
| Netlify | `netlify/functions/chat.js` | `export const handler = async (event) =>` |
| Cloudflare Workers | `worker.js` | `export default { fetch(request, env) { … } }` |
| AWS Lambda (HTTP API) | any | `export const handler = async (event) =>` |
| Deno Deploy | any | `Deno.serve((req) => …)` |

The body (read env var, validate input, forward with key, return JSON) is identical.

---

## 3. Setting secrets on the proxy host

**Never commit the key.** Set it as an environment variable on the host.

### Vercel — CLI

```bash
npm i -g vercel
vercel login
vercel link              # one-time, links the directory to a Vercel project
echo "<your-key>" | vercel env add LLM_API_KEY production
vercel --prod            # deploy
```

### Vercel — dashboard

`Project → Settings → Environment Variables` → add `LLM_API_KEY` for the
`Production` environment → redeploy.

### Other hosts

- **Cloudflare:** `wrangler secret put LLM_API_KEY`
- **Netlify:** `netlify env:set LLM_API_KEY <value>`
- **AWS Lambda:** Console → Function → Configuration → Environment variables
- **GitHub Actions deploy step:** repository secret + `env:` in the workflow

---

## 4. Client wiring

The client now needs **only the proxy URL**, never the provider key.

```ts
// services/ai.ts
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL; // e.g. https://my-proxy.vercel.app/api/chat

export async function chat(messages, temperature = 0.7) {
  const r = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? '';
}
```

### Client `.env`

```bash
# .env  (gitignored)
VITE_AI_PROXY_URL=https://my-proxy.vercel.app/api/chat
```

Use the prefix your bundler exposes:

- Vite: `VITE_*`
- Next.js: `NEXT_PUBLIC_*`
- Create React App: `REACT_APP_*`
- Vue CLI: `VUE_APP_*`
- SvelteKit: `PUBLIC_*`

Anything else is server-only and must not be read from the browser.

---

## 5. Model selection

Two clean strategies — pick one.

**A. Server picks the model.** Simple, secure, predictable cost.

```js
// api/chat.js
const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b:free';
body: JSON.stringify({ model: MODEL, messages, temperature })
```

The client never names a model. To change models you update the env var and redeploy.

**B. Client requests a model from an allowlist.** Lets the UI offer a chooser.

```js
const ALLOWED = new Set([
  'openai/gpt-oss-120b:free',
  'anthropic/claude-3.7-sonnet',
  'meta-llama/llama-3.3-70b-instruct',
]);
const model = ALLOWED.has(req.body.model) ? req.body.model : 'openai/gpt-oss-120b:free';
```

Never trust the client model string directly — a caller could route to an
expensive model and burn your quota.

---

## 6. Hardening the proxy

The bare proxy is enough to hide a key but anyone on the internet can still call it.
Layer these on for production:

1. **Restrict CORS** to your real frontend origin.
   `Access-Control-Allow-Origin: https://app.example.com`
2. **Rate-limit by IP** (e.g. Upstash Redis + sliding window, or Vercel KV).
3. **Require a session token** if your app has logins — verify a JWT or session
   cookie before forwarding.
4. **Cap message length and array size** to bound provider cost per call.
5. **Block referrers** that aren't your domain (`Referer` header check).
   Easy to spoof but stops casual abuse.
6. **Strip unsafe fields** from `req.body` — only pass through `messages`,
   `temperature`, `max_tokens`, and other whitelisted keys.
7. **Log usage** — most providers return `usage.total_tokens` in the response.
   Tally per IP/session to detect runaway clients.
8. **Set a hard budget alarm** on the provider dashboard.

Sample input clamp:

```js
if (messages.length > 30) return res.status(400).json({ error: 'too many messages' });
const total = messages.reduce((n, m) => n + (m.content?.length || 0), 0);
if (total > 20000) return res.status(400).json({ error: 'payload too large' });
```

---

## 7. Streaming responses (optional)

If your UI shows tokens as they arrive, swap the JSON forward for a passthrough stream.

```js
const upstream = await fetch(PROVIDER_URL, {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages, temperature, stream: true }),
});
res.setHeader('Content-Type', 'text/event-stream');
upstream.body.pipe(res);
```

On the client, read the stream:

```ts
const r = await fetch(PROXY_URL, { method: 'POST', body: JSON.stringify({ messages }) });
const reader = r.body.getReader();
const dec = new TextDecoder();
let buf = '';
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  // parse SSE lines starting with `data: ` and accumulate `delta.content`
}
```

Vercel Hobby supports streaming on the Node runtime. For very long streams
prefer the Edge runtime (`export const runtime = 'edge'`).

---

## 8. Local development

Run the proxy locally so the client works the same way it will in production.

```bash
vercel dev          # boots api/* on http://localhost:3000
```

Point the client `.env` at the local proxy:

```bash
VITE_AI_PROXY_URL=http://localhost:3000/api/chat
```

For other hosts: `wrangler dev`, `netlify dev`, `sam local start-api`, etc.
Or just run the handler logic inside a 20-line Node script during development.

---

## 9. Deployment checklist

Before going live:

- [ ] Provider key set as a host secret (never in code, never in client bundle)
- [ ] Client uses **only** the proxy URL — no provider domain or key in the bundle
- [ ] `grep -r "<key-prefix>" dist/` returns nothing (e.g. `sk-`, `xai-`, `gsk_`)
- [ ] CORS origin set to your real frontend (not `*`) in production
- [ ] Rate limiting or auth on the proxy
- [ ] Provider dashboard budget alert configured
- [ ] Streaming path works if the UI uses it
- [ ] A failing key returns a useful error to the client without leaking details

---

## 10. Rotating a leaked key

If a key ever escapes (committed, screenshot, log, support ticket):

1. **Revoke immediately** in the provider dashboard.
2. **Generate a new key.**
3. Update the host env var: `vercel env rm LLM_API_KEY production` then re-add.
4. Redeploy the proxy. The client needs no change because it doesn't know the key.
5. Audit logs for unexpected usage during the leak window.

A proxy makes this a one-minute fix instead of a build + bundle + cache-bust cycle.

---

## 11. Cost notes

- A serverless invocation is roughly free at low volume (Vercel Hobby:
  100 GB-hours/month free). The provider call dominates cost.
- Cache frequent, identical requests on the proxy (`Cache-Control` + a KV store)
  to avoid repeat provider charges.
- If you stream, set `maxDuration` high enough for the slowest expected reply.
- Free-tier models (e.g. OpenRouter's `:free` suffix) rate-limit upstream;
  surface 429s clearly to the client and back off.

---

## Summary

| Layer | Lives where | Holds the key? |
|---|---|---|
| Browser / client bundle | User's device | **No** |
| Proxy (`api/chat.js`) | Vercel / CF / Netlify / Lambda | **Yes**, via env var |
| Provider | OpenRouter / OpenAI / Anthropic / … | The key authenticates here |

One function, one env var, one client URL. That's the whole pattern.
