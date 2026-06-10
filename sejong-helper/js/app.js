/* app.js — main application controller */
(async function () {
  const state = {
    data: null,
    activeTab: 'restaurants',
    query: '',
    filters: { maxPrice: 4, maxDistance: 2000, cuisines: [], dietary: [] },
    sortBy: 'distance'
  };

  const cardsGrid = document.getElementById('cardsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const tabs = document.querySelectorAll('.tab');
  const filtersPanel = document.getElementById('filters');
  const filterGroup = document.querySelector('.filter-group');
  const budgetSlider = document.getElementById('budgetSlider');
  const budgetLabel = document.getElementById('budgetLabel');
  const distanceSlider = document.getElementById('distanceSlider');
  const distanceLabel = document.getElementById('distanceLabel');
  const sortSelect = document.getElementById('sortSelect');
  const cuisineFilters = document.getElementById('cuisineFilters');
  const dietaryFilters = document.getElementById('dietaryFilters');
  const resetBtn = document.getElementById('resetFilters');
  const darkToggle = document.getElementById('darkToggle');
  const mapToggle = document.getElementById('mapToggle');
  const mapPane = document.getElementById('mapPane');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalContent = document.getElementById('modalContent');

  UIManager.initTheme();
  MapHandler.init();

  state.data = await DataLoader.loadAll();
  buildFilterOptions();
  render();
  MapHandler.invalidateSize();

  function buildFilterOptions() {
    const cuisines = new Set();
    const dietary = new Set();
    state.data.restaurants.forEach(r => {
      (r.cuisine || []).forEach(c => cuisines.add(c));
      (r.dietary || []).forEach(d => dietary.add(d));
    });
    cuisineFilters.innerHTML = [...cuisines].sort().map(c =>
      `<label><input type="checkbox" value="${c}" data-filter="cuisine"> ${c}</label>`).join('');
    dietaryFilters.innerHTML = [...dietary].sort().map(d =>
      `<label><input type="checkbox" value="${d}" data-filter="dietary"> ${d}</label>`).join('');
  }

  function getCurrentItems() {
    const kind = state.activeTab;
    if (kind === 'favorites') {
      const favIds = UIManager.getFavorites();
      const all = [...state.data.restaurants.map(i => ({...i, _kind:'restaurants'})),
                    ...state.data.clubs.map(i => ({...i, _kind:'clubs'})),
                    ...state.data.services.map(i => ({...i, _kind:'services'}))];
      return all.filter(i => favIds.includes(i.id));
    }
    return state.data[kind].map(i => ({...i, _kind: kind}));
  }

  function render() {
    let items = getCurrentItems();
    items = FilterEngine.search(items, state.query);

    if (state.activeTab === 'restaurants') {
      items = FilterEngine.filterRestaurants(items, state.filters);
      items = FilterEngine.sortItems(items, state.sortBy);
    } else if (state.activeTab !== 'favorites') {
      items = FilterEngine.sortItems(items, 'distance');
    }

    if (state.activeTab === 'favorites') {
      cardsGrid.innerHTML = items.length
        ? items.map(i => UIManagerCardHtml(i, i._kind)).join('')
        : `<div class="empty-state">No favorites yet. Tap the ☆ on any item to save it here.</div>`;
    } else {
      UIManager.renderCards(cardsGrid, items, state.activeTab);
    }

    resultsCount.textContent = `${items.length} result${items.length === 1 ? '' : 's'}`;
    MapHandler.setMarkers(items, openModal);
    attachCardEvents();
  }

  // helper to render a single card via UIManager's batch renderer
  function UIManagerCardHtml(item, kind) {
    const div = document.createElement('div');
    UIManager.renderCards(div, [item], kind);
    return div.innerHTML;
  }

  function attachCardEvents() {
    cardsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        const id = card.dataset.id;
        const kind = card.dataset.kind;
        const item = findItem(id, kind);
        if (item) openModal(item, kind);
      });
    });
    cardsGrid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        UIManager.toggleFavorite(btn.dataset.fav);
        render();
      });
    });
  }

  function findItem(id, kind) {
    return (state.data[kind] || []).find(i => i.id === id);
  }

  function openModal(item, kind) {
    kind = kind || item._kind || state.activeTab;
    modalContent.innerHTML = UIManager.renderModal(item, kind);
    modalOverlay.classList.add('is-open');
    MapHandler.focusOn(item);
  }

  modalClose.addEventListener('click', () => modalOverlay.classList.remove('is-open'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('is-open'); });

  // Tabs
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected','true');
    state.activeTab = tab.dataset.tab;
    filterGroup.style.display = state.activeTab === 'restaurants' ? 'block' : 'none';
    render();
  }));
  filterGroup.style.display = 'block';

  // Search
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    render();
  });

  // Filters
  budgetSlider.addEventListener('input', () => {
    const v = +budgetSlider.value;
    state.filters.maxPrice = v;
    budgetLabel.textContent = v >= 4 ? 'Any' : '₩'.repeat(v) + ' or less';
    render();
  });
  distanceSlider.addEventListener('input', () => {
    const v = +distanceSlider.value;
    state.filters.maxDistance = v;
    distanceLabel.textContent = v >= 2000 ? '2 km+' : `${v} m`;
    render();
  });
  sortSelect.addEventListener('change', () => {
    state.sortBy = sortSelect.value;
    render();
  });
  cuisineFilters.addEventListener('change', (e) => {
    state.filters.cuisines = [...cuisineFilters.querySelectorAll('input:checked')].map(i => i.value);
    render();
  });
  dietaryFilters.addEventListener('change', (e) => {
    state.filters.dietary = [...dietaryFilters.querySelectorAll('input:checked')].map(i => i.value);
    render();
  });
  resetBtn.addEventListener('click', () => {
    state.filters = { maxPrice: 4, maxDistance: 2000, cuisines: [], dietary: [] };
    budgetSlider.value = 4; budgetLabel.textContent = 'Any';
    distanceSlider.value = 2000; distanceLabel.textContent = '2 km+';
    cuisineFilters.querySelectorAll('input').forEach(i => i.checked = false);
    dietaryFilters.querySelectorAll('input').forEach(i => i.checked = false);
    sortSelect.value = 'distance'; state.sortBy = 'distance';
    render();
  });

  // Dark mode
  darkToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    UIManager.applyTheme(next);
  });

  // Mobile map toggle
  mapToggle.addEventListener('click', () => {
    mapPane.classList.toggle('is-visible');
    MapHandler.invalidateSize();
  });

  // AI Assistant chat widget (Phase 2)
  const ai = new AIAssistant();
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  function addChatMessage(text, role, loading) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}` + (loading ? ' is-loading' : '');
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
  }

  chatFab.addEventListener('click', () => {
    const open = chatPanel.classList.toggle('is-open');
    chatPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) chatInput.focus();
  });
  chatClose.addEventListener('click', () => {
    chatPanel.classList.remove('is-open');
    chatPanel.setAttribute('aria-hidden', 'true');
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;
    addChatMessage(question, 'user');
    chatInput.value = '';
    const loadingMsg = addChatMessage('Thinking...', 'bot', true);
    const reply = await ai.sendMessage(question);
    loadingMsg.remove();
    addChatMessage(reply, 'bot');
  });
})();
