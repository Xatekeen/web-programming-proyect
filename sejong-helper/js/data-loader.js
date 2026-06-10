/* data-loader.js — provides the bundled datasets.
   Loaded as plain <script> globals (data/*.js -> window.SEJONG_DATA)
   instead of fetch(), so the app works when index.html is opened
   directly via file:// (browsers block fetch() of local files there). */
const DataLoader = (() => {
  let cache = null;

  async function loadAll() {
    if (cache) return cache;
    const data = window.SEJONG_DATA || {};
    cache = {
      restaurants: data.restaurants || [],
      clubs: data.clubs || [],
      services: data.services || [],
    };
    return cache;
  }

  return { loadAll };
})();
