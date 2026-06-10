# Sejong Helper — International Student Guide

A Phase 1 MVP web app helping international students at Sejong University discover nearby restaurants, clubs, and essential services around the Gwangjin-gu campus.

## Features

- Interactive Leaflet map (OpenStreetMap tiles, no API key required) centered on campus
- Tabs for Restaurants, Clubs, Services, and Favorites
- Multi-criteria filters: budget, cuisine, dietary restrictions, distance
- Sorting by distance, rating, or price
- Fuzzy text search across all categories
- Favorites saved via `localStorage`
- Light/dark mode toggle (persisted)
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
│   ├── app.js            # main controller
│   ├── data-loader.js     # fetches JSON data
│   ├── filter-engine.js    # search/filter/sort logic
│   ├── map-handler.js      # Leaflet map + markers
│   ├── ui-manager.js        # rendering, theme, favorites
│   └── ai-assistant.js      # Phase 2 client for the AI proxy
├── data/
│   ├── restaurants.json
│   ├── clubs.json
│   └── services.json
├── server.js                # Phase 2 backend proxy (Express + Anthropic SDK)
├── package.json
└── .env.example
```

Leaflet is loaded via CDN (`unpkg.com/leaflet`) for simplicity — no local `lib/` build step required.

## Phase 2 — AI Assistant

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
  student's question plus a trimmed copy of `data/*.json` to Claude
  (`claude-sonnet-4-5` by default, configurable via `ANTHROPIC_MODEL`).
- `POST /api/recommendations` — `{ budget, cuisine, dietary, distance, ... }`
  → `{ ids: string[] }`. Returns up to 5 ranked restaurant ids.
- `GET /api/health` — basic health check.

`js/ai-assistant.js` exposes `sendMessage()`, `generateRecommendations()`,
and `isAvailable()`, all calling the proxy — no API key ever touches the
browser.
