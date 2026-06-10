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
      case 'distance':
      default:
        return arr.sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0));
    }
  }

  return { search, filterRestaurants, sortItems };
})();
