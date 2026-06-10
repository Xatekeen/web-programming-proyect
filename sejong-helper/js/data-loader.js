/* data-loader.js — fetches and caches JSON datasets */
const DataLoader = (() => {
  let cache = null;
  // Captured synchronously at script load time (currentScript is null later).
  const DATA_BASE = new URL('../data/', document.currentScript.src);

  async function loadAll() {
    if (cache) return cache;
    const base = DATA_BASE;
    const [restaurants, clubs, services] = await Promise.all([
      fetch(new URL('restaurants.json', base)).then(r => r.json()),
      fetch(new URL('clubs.json', base)).then(r => r.json()),
      fetch(new URL('services.json', base)).then(r => r.json()),
    ]);
    cache = { restaurants, clubs, services };
    return cache;
  }

  return { loadAll };
})();
