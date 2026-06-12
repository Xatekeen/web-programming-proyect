# Sejong University Web Project

A responsive, multi-page website for Sejong University, plus an embedded
**Sejong Helper** app — an international-student companion with maps, search,
filters, guides, reviews, and multi-language support.

## Site pages

- `index.html` — Home, with a hero section and quick links
- `about.html` — Vision, history, and overview
- `academics.html` — Colleges and program cards
- `admissions.html` — Admissions workflow and a validated inquiry form
- `research.html` — Animated research statistics
- `life.html` — Student life information (housing, clubs, services, etc.)
- `news.html` — Filterable campus news/notices (Notice, Event, Research)
- `contact.html` — Contact information
- `sejong-helper/` — the Sejong Helper app (see below)

Shared assets: `styles.css`, `script.js`, `assets/`.

## Main site features

- Sticky navigation with an expanded sitemap-style sidebar
- Full-screen animated campus hero section
- Search dialog with in-page result suggestions
- Academic program cards with consistent styling
- Admissions inquiry form with validation
- Animated research statistics counters
- Filterable news cards
- Responsive layout for mobile, tablet, and desktop, with a collapsible menu

## Sejong Helper app

A separate but linked app (`sejong-helper/index.html`, reachable via "Helper"
in the main navigation) that helps international students find restaurants,
clubs, and services around the Gwangjin-gu campus, and offers student-life
tools:

- Interactive Leaflet map (OpenStreetMap, no API key required)
- Tabs for Restaurants, Clubs, Services, and Favorites
- Filters: budget, cuisine, dietary restrictions, distance, open-now, time of day
- Sorting by distance, rating, price, or closing soon
- Fuzzy text search across all categories
- Favorites and custom Collections (saved in `localStorage`, with notes and CSV export)
- Student Guides (Q&A on visas, housing, banking, transit, safety, etc.)
- Student Reviews (community tips/warnings/ratings per place)
- Budget Calculator, Compare Tool, and Quick Facts Dashboard
- Light/dark mode toggle (persisted)
- Full UI and content translated into 10 languages (English, Euskara, Korean,
  Chinese, Vietnamese, Japanese, Russian, Mongolian, Uzbek, Arabic)
- AI chat assistant for free-text questions (via an optional backend proxy)

See [sejong-helper/README.md](sejong-helper/README.md) for its structure and
how to run the optional AI assistant backend.

## How to run

Both the main site and the Helper app are static — open `index.html` in a
browser, or serve the project root with any static server, e.g.:

```
npx serve .
```

No build step or package installation is required for the site itself. The
Sejong Helper AI assistant has an optional Node.js backend — see its README.

## Project structure

```
.
├── index.html, about.html, academics.html, admissions.html,
│   research.html, life.html, news.html, contact.html
├── styles.css
├── script.js
├── assets/                  # shared images and icons
└── sejong-helper/           # Sejong Helper app
    ├── index.html
    ├── css/, js/, data/
    ├── server.js, package.json, .env.example   # optional AI proxy
    └── README.md
```

## Evaluation alignment

- **Functionality and completeness**: multi-page navigation, sitemap sidebar,
  search, filtering, form handling, animated counters, responsive layout,
  plus the fully-featured Sejong Helper app
- **Quality of implementation**: semantic HTML, organized CSS, accessible
  labels, reduced-motion support
- **Project understanding**: clear examples of HTML structure, CSS
  Grid/Flexbox, JavaScript events, client-side state (`localStorage`),
  internationalization, and map integration
</content>
