/* server.js — Phase 2 backend proxy for the Sejong Helper AI assistant.
 *
 * Keeps the Anthropic API key on the server side. The frontend
 * (js/ai-assistant.js) talks to this proxy instead of calling the
 * Claude API directly from the browser.
 *
 * Usage:
 *   1. cp .env.example .env   and fill in ANTHROPIC_API_KEY
 *   2. npm install
 *   3. npm start               (serves the API on AI_PROXY_PORT, default 3001)
 *
 * The static site itself can still be served separately (e.g. `npx serve .`)
 * — js/ai-assistant.js posts to http://localhost:<AI_PROXY_PORT>/api/ai etc.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const PORT = process.env.AI_PROXY_PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const app = express();
app.use(express.json());

// Allow the static frontend (served on a different port) to call this API.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[sejong-helper] WARNING: ANTHROPIC_API_KEY is not set. ' +
    'Copy .env.example to .env and add your key, or the /api/ai endpoints will return errors.');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load the place data so the assistant can ground its answers in it.
function loadData() {
  const dataDir = path.join(__dirname, 'data');
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
  return {
    restaurants: read('restaurants.json'),
    clubs: read('clubs.json'),
    services: read('services.json'),
  };
}

const SYSTEM_PROMPT = `You are the Sejong Helper assistant, a friendly guide for international
students at Sejong University in Gwangjin-gu, Seoul. Answer questions about nearby
restaurants, student clubs, and essential services using ONLY the JSON data provided
in context. Be concise, practical, and mention specific place names, distances, and
prices/hours where relevant. If nothing in the data matches, say so honestly and give
general guidance instead.`;

// POST /api/ai  { message: string }
app.post('/api/ai', async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing "message" string in request body.' });
  }

  try {
    const data = loadData();
    const context = JSON.stringify({
      restaurants: data.restaurants.map(({ id, name, nameEnglish, cuisine, dietary, priceLevel, rating, distance_meters, tags, hours }) =>
        ({ id, name, nameEnglish, cuisine, dietary, priceLevel, rating, distance_meters, tags, hours })),
      clubs: data.clubs.map(({ id, name, category, meetingTime, languages, description }) =>
        ({ id, name, category, meetingTime, languages, description })),
      services: data.services.map(({ id, name, type, distance_meters, hours, tags }) =>
        ({ id, name, type, distance_meters, hours, tags })),
    });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Campus data (JSON):\n${context}\n\nStudent question: ${message}` }
      ],
    });

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    res.json({ reply });
  } catch (err) {
    console.error('[sejong-helper] /api/ai error:', err.message);
    res.status(500).json({ error: 'AI assistant request failed.', detail: err.message });
  }
});

// POST /api/recommendations  { budget, cuisine, dietary, distance, category }
app.post('/api/recommendations', async (req, res) => {
  const preferences = req.body || {};

  try {
    const data = loadData();
    const context = JSON.stringify(data.restaurants.map(({ id, name, nameEnglish, cuisine, dietary, priceLevel, rating, distance_meters, tags }) =>
      ({ id, name, nameEnglish, cuisine, dietary, priceLevel, rating, distance_meters, tags })));

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT + ' Respond ONLY with a JSON array of up to 5 restaurant "id" strings, ranked best-first, and nothing else.',
      messages: [
        { role: 'user', content: `Restaurant data (JSON):\n${context}\n\nStudent preferences (JSON):\n${JSON.stringify(preferences)}\n\nReturn the ranked id array.` }
      ],
    });

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    let ids = [];
    try { ids = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]'); } catch { ids = []; }

    res.json({ ids });
  } catch (err) {
    console.error('[sejong-helper] /api/recommendations error:', err.message);
    res.status(500).json({ error: 'Recommendation request failed.', detail: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, model: MODEL }));

app.listen(PORT, () => {
  console.log(`[sejong-helper] AI proxy listening on http://localhost:${PORT}`);
});
