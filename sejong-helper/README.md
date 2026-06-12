# Sejong Helper — International Student Guide

A web app helping international students at Sejong University discover nearby restaurants, clubs, and essential services around the Gwangjin-gu campus, plus a set of student-life tools.

## Features

- Interactive Leaflet map (OpenStreetMap tiles, no API key required) centered on campus
- Tabs for Restaurants, Clubs, Services, and Favorites
- Multi-criteria filters: budget, cuisine, dietary restrictions, distance, open-now, time of day
- Sorting by distance, rating, price, or closing soon
- Fuzzy text search across all categories
- Favorites and custom Collections (saved via `localStorage`, with notes and CSV export)
- Student Guides (Q&A on visas, housing, banking, transit, safety, etc.)
- Student Reviews (community tips/warnings/ratings per place)
- Budget Calculator
- Compare Tool (side-by-side comparison of places)
- Quick Facts Dashboard
- Light/dark mode toggle (persisted)
- Full UI + content translations in 10 languages (English, Euskara, Korean, Chinese, Vietnamese, Japanese, Russian, Mongolian, Uzbek, Arabic) — switch from Settings
- AI chat assistant for free-text questions
- Mobile-first responsive layout (map/list split on desktop, stacked on tablet, toggleable map on mobile)

## Running locally

This is a static site — serve the folder with any static server, e.g.:

```
npx serve .
```

Then open the printed local URL in your browser.

## Project structure

```
sejong-helper/
├── index.html
├── css/style.css
├── js/
│   ├── app.js              # main controller
│   ├── data-loader.js      # loads place data
│   ├── filter-engine.js     # search/filter/sort logic
│   ├── map-handler.js        # Leaflet map + markers
│   ├── ui-manager.js          # rendering, theme, favorites, modal
│   ├── features.js             # i18n, guides, reviews, budget, compare,
│   │                              dashboard, collections, settings
│   ├── tag-labels-data.js       # translated labels for cuisine/dietary/tags
│   └── ai-assistant.js          # client for the AI chat proxy
├── data/
│   ├── restaurants.js
│   ├── clubs.js
│   ├── guides.js
│   └── services.js
├── server.js                # AI chat backend proxy (Express + Anthropic SDK)
├── package.json
└── .env.example
```

Leaflet is loaded via CDN (`unpkg.com/leaflet`) for simplicity — no local `lib/` build step required.

## AI Assistant

The chat bubble (bottom-right "💬") lets students ask free-text questions
("vegan food near campus", "halal restaurants under ₩₩"). It's answered by
Claude via a small backend proxy that keeps the API key server-side.

### Setup

```
cd sejong-helper
cp .env.example .env      # then edit .env and add your ANTHROPIC_API_KEY
npm install
npm start                  # starts the proxy on http://localhost:3001
```

In another terminal, serve the static site as usual (e.g. `npx serve .` from
the project root) and open the page — the chat widget will call the proxy
automatically. If the proxy isn't running, the assistant replies with a
friendly "unavailable" message instead of failing silently.

### API endpoints (server.js)

- `POST /api/ai` — `{ message: string }` → `{ reply: string }`. Sends the
  student's question plus a trimmed copy of the place data to Claude
  (`claude-sonnet-4-5` by default, configurable via `ANTHROPIC_MODEL`).
- `POST /api/recommendations` — `{ budget, cuisine, dietary, distance, ... }`
  → `{ ids: string[] }`. Returns up to 5 ranked restaurant ids.
- `GET /api/health` — basic health check.

`js/ai-assistant.js` exposes `sendMessage()`, `generateRecommendations()`,
and `isAvailable()`, all calling the proxy — no API key ever touches the
browser.
</content>
