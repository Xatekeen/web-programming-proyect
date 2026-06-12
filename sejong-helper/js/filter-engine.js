/* filter-engine.js — multi-criteria filtering, search and sorting */
const FilterEngine = (() => {

  function search(items, query) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item => {
      const haystack = [
        item.name, item.nameEnglish, item.notes, item.description,
        ...(item.cuisine || []), ...(item.tags || []), item.category, item.type
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  // Restaurants/services filter (budget, cuisine, dietary, distance)
  function filterRestaurants(items, filters) {
    return items.filter(item => {
      if (filters.maxPrice && item.priceLevel > filters.maxPrice) return false;
      if (filters.maxDistance && item.distance_meters > filters.maxDistance) return false;
      if (filters.cuisines && filters.cuisines.length) {
        const has = (item.cuisine || []).some(c => filters.cuisines.includes(c));
        if (!has) return false;
      }
      if (filters.dietary && filters.dietary.length) {
        const has = (item.dietary || []).some(d => filters.dietary.includes(d));
        if (!has) return false;
      }
      return true;
    });
  }

  function sortItems(items, sortBy) {
    const arr = [...items];
    switch (sortBy) {
      case 'rating':
        return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'price':
        return arr.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0));
      case 'closing':
        return arr.sort((a, b) => {
          const sa = a.hours ? HoursUtil.getStatus(a.hours) : {};
          const sb = b.hours ? HoursUtil.getStatus(b.hours) : {};
          const ca = sa.open && sa.closesInMin != null ? sa.closesInMin : Infinity;
          const cb = sb.open && sb.closesInMin != null ? sb.closesInMin : Infinity;
          return ca - cb;
        });
      case 'distance':
      default:
        return arr.sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0));
    }
  }

  // Only places open right now (items without hours are kept)
  function filterOpenNow(items) {
    return items.filter(item => {
      if (!item.hours) return true;
      const st = HoursUtil.getStatus(item.hours);
      if (!st.known) return true;
      return st.open;
    });
  }

  // "past-midnight" | "early-morning" | "lunch"
  const TIME_WINDOWS = {
    'past-midnight': 2.5 * 60,   // 02:30
    'early-morning': 8 * 60,     // 08:00
    'lunch': 12.5 * 60           // 12:30
  };
  function filterTimeOfDay(items, key) {
    if (!key || !TIME_WINDOWS[key]) return items;
    const probe = new Date();
    probe.setHours(0, TIME_WINDOWS[key], 0, 0);
    return items.filter(item => {
      if (!item.hours) return false;
      const st = HoursUtil.getStatus(item.hours, probe);
      return st.known && st.open;
    });
  }

  return { search, filterRestaurants, sortItems, filterOpenNow, filterTimeOfDay };
})();
