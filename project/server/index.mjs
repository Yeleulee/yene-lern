import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = 'gemini-1.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

function ensureKey(res) {
  if (!GEMINI_KEY) {
    res.status(500).json({ error: 'Server API key missing' });
    return false;
  }
  return true;
}

// Generate generic content from a prompt
app.post('/api/gemini/generate', async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { prompt = '', config = {}, model = DEFAULT_MODEL } = req.body || {};

    const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: String(prompt) }]}],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, ...config }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Gemini API error' });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error' });
  }
});

// Quick connectivity test
app.post('/api/gemini/test', async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const url = `${BASE_URL}/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond with OK" }]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ success: false, message: data?.error?.message || 'Gemini API error' });
    return res.json({ success: true, message: 'Connected' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI proxy listening on :${PORT}`);
});


