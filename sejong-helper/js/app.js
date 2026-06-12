/* app.js — main application controller */
(async function () {
  const state = {
    data: null,
    activeTab: 'restaurants',
    query: '',
    filters: { maxPrice: 4, maxDistance: 2000, cuisines: [], dietary: [], openNow: false, timeOfDay: '' },
    sortBy: 'distance',
    guideQuery: '',
    compareSelection: [],
    reviewFilters: {},
    budgetState: {}
  };

  const FEATURE_TABS = ['guides', 'reviews', 'budget', 'compare', 'dashboard', 'collections', 'settings'];

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
  const openNowToggle = document.getElementById('openNowToggle');
  const timeOfDaySelect = document.getElementById('timeOfDaySelect');
  const featurePanel = document.getElementById('featurePanel');
  const guideSearchRow = document.getElementById('guideSearchRow');
  const guideSearchInput = document.getElementById('guideSearchInput');
  const layout = document.querySelector('.layout');

  const TAB_EMOJI = {
    restaurants: '🍜', clubs: '🎉', services: '🏥', favorites: '⭐',
    guides: '📚', reviews: '📝', budget: '💰', compare: '🔄',
    dashboard: '📊', collections: '📌', settings: '⚙️'
  };
  function applyLanguage() {
    const t = SettingsManager.t;
    tabs.forEach(tab => {
      const key = tab.dataset.tab;
      const emoji = TAB_EMOJI[key] || '';
      tab.textContent = `${emoji} ${t(key)}`;
    });
    mapToggle.textContent = `🗺️ ${t('map')}`;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setPlaceholder = (id, val) => { const el = document.getElementById(id); if (el) el.placeholder = val; };

    setText('brandTagline', t('tagline'));
    setPlaceholder('searchInput', t('searchPlaceholder'));
    setText('filtersTitle', t('filtersTitle'));
    setText('cuisineLegend', t('cuisine'));
    setText('dietaryLegend', t('dietary'));
    setText('openNowLabel', `⏰ ${t('openNow')}`);
    setText('timeOfDayLabel', t('timeOfDay'));
    setText('optAnyTime', t('anyTime'));
    setText('optPastMidnight', t('pastMidnight'));
    setText('optEarlyMorning', t('earlyMorning'));
    setText('optLunch', t('lunchHours'));
    setText('maxDistanceLabel', t('maxDistance'));
    setText('sortByLabel', t('sortBy'));
    setText('optSortDistance', t('sortDistance'));
    setText('optSortRating', t('sortRating'));
    setText('optSortPrice', t('sortPrice'));
    setText('optSortClosing', t('sortClosing'));
    setText('resetFilters', t('resetFilters'));
    setPlaceholder('guideSearchInput', t('searchPlaceholder'));
    setText('chatTitle', t('chatTitle'));
    setText('chatGreeting', t('chatGreeting'));
    setPlaceholder('chatInput', t('chatPlaceholder'));
    setText('chatSendBtn', t('chatSend'));

    // Re-sync the budget-slider "Any" label if it's at max
    if (+budgetSlider.value >= 4) budgetLabel.textContent = t('any');
    if (+distanceSlider.value >= 2000) distanceLabel.textContent = '2 km+';
  }

  UIManager.initTheme();
  MapHandler.init();
  applyLanguage();

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
    if (FEATURE_TABS.includes(state.activeTab)) {
      renderFeatureTab();
      return;
    }

    let items = getCurrentItems();
    items = FilterEngine.search(items, state.query);

    if (state.activeTab === 'restaurants') {
      items = FilterEngine.filterRestaurants(items, state.filters);
      items = FilterEngine.sortItems(items, state.sortBy);
    } else if (state.activeTab !== 'favorites') {
      items = FilterEngine.sortItems(items, 'distance');
    }

    if (state.filters.openNow) items = FilterEngine.filterOpenNow(items);
    if (state.filters.timeOfDay) items = FilterEngine.filterTimeOfDay(items, state.filters.timeOfDay);

    if (state.activeTab === 'favorites') {
      cardsGrid.innerHTML = items.length
        ? items.map(i => UIManagerCardHtml(i, i._kind)).join('')
        : `<div class="empty-state">${SettingsManager.t('noFavorites')}</div>`;
    } else {
      UIManager.renderCards(cardsGrid, items, state.activeTab);
    }

    resultsCount.textContent = `${items.length} ${SettingsManager.t(items.length === 1 ? 'result' : 'results')}`;
    MapHandler.setMarkers(items, openModal);
    attachCardEvents();
  }

  function getAllItemsFlat() {
    return [
      ...state.data.restaurants.map(i => ({ ...i, _kind: 'restaurants' })),
      ...state.data.clubs.map(i => ({ ...i, _kind: 'clubs' })),
      ...state.data.services.map(i => ({ ...i, _kind: 'services' }))
    ];
  }

  function renderFeatureTab() {
    layout.classList.add('feature-mode');
    mapPane.style.display = 'none';
    filtersPanel.style.display = 'none';
    cardsGrid.style.display = 'none';
    resultsCount.style.display = 'none';
    guideSearchRow.style.display = state.activeTab === 'guides' ? 'block' : 'none';
    featurePanel.style.display = 'block';

    const all = getAllItemsFlat();
    switch (state.activeTab) {
      case 'guides':
        FeaturesUI.renderGuides(featurePanel, state.data, state.guideQuery);
        break;
      case 'reviews':
        FeaturesUI.renderReviews(featurePanel, all, state.reviewFilters);
        break;
      case 'budget':
        FeaturesUI.renderBudget(featurePanel, state.data, state.budgetState);
        break;
      case 'compare':
        FeaturesUI.renderCompare(featurePanel, all, state.compareSelection);
        break;
      case 'dashboard':
        FeaturesUI.renderDashboard(featurePanel, state.data, (query) => {
          // jump to restaurants/services tab filtered by this place's name
          const tabBtn = [...tabs].find(t => t.dataset.tab === 'restaurants');
          tabBtn.click();
          searchInput.value = query;
          state.query = query;
          render();
        });
        break;
      case 'collections':
        FeaturesUI.renderCollections(featurePanel, all, () => renderFeatureTab());
        break;
      case 'settings':
        FeaturesUI.renderSettings(featurePanel, () => { applyLanguage(); render(); });
        break;
    }
  }

  function exitFeatureMode() {
    layout.classList.remove('feature-mode');
    mapPane.style.display = '';
    cardsGrid.style.display = '';
    resultsCount.style.display = '';
    guideSearchRow.style.display = 'none';
    featurePanel.style.display = 'none';
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

    const noteEl = modalContent.querySelector('.modal-note');
    if (noteEl) {
      noteEl.addEventListener('change', () => CollectionsManager.setNote(item.id, noteEl.value));
    }
    const colSelect = modalContent.querySelector('.modal-collection-select');
    if (colSelect) {
      colSelect.addEventListener('change', () => {
        if (colSelect.value) {
          CollectionsManager.addPlace(colSelect.value, item.id);
          colSelect.value = '';
          alert('Saved to collection!');
        }
      });
    }
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
    if (FEATURE_TABS.includes(state.activeTab)) {
      renderFeatureTab();
    } else {
      exitFeatureMode();
      filtersPanel.style.display = '';
      render();
      MapHandler.invalidateSize();
    }
  }));
  filterGroup.style.display = 'block';

  // Open Now / Time of day filters
  openNowToggle.addEventListener('change', () => {
    state.filters.openNow = openNowToggle.checked;
    render();
  });
  timeOfDaySelect.addEventListener('change', () => {
    state.filters.timeOfDay = timeOfDaySelect.value;
    render();
  });

  // Guides search
  guideSearchInput.addEventListener('input', () => {
    state.guideQuery = guideSearchInput.value;
    renderFeatureTab();
  });

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
    state.filters = { maxPrice: 4, maxDistance: 2000, cuisines: [], dietary: [], openNow: false, timeOfDay: '' };
    budgetSlider.value = 4; budgetLabel.textContent = 'Any';
    distanceSlider.value = 2000; distanceLabel.textContent = '2 km+';
    cuisineFilters.querySelectorAll('input').forEach(i => i.checked = false);
    dietaryFilters.querySelectorAll('input').forEach(i => i.checked = false);
    sortSelect.value = 'distance'; state.sortBy = 'distance';
    openNowToggle.checked = false;
    timeOfDaySelect.value = '';
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
