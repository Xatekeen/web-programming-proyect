/* ui-manager.js — rendering cards, modal, filters UI, dark mode, favorites */
const UIManager = (() => {

  const FAV_KEY = 'sejong-helper-favorites';

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch { return []; }
  }
  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.push(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs;
  }
  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function priceLabel(level) {
    return '₩'.repeat(level || 1);
  }

  function renderCard(item, kind) {
    const fav = isFavorite(item.id);
    let metaHtml = '';
    let tagsHtml = '';
    let title = item.name;
    let sub = item.nameEnglish || '';

    if (kind === 'restaurants') {
      metaHtml = `<span class="price">${priceLabel(item.priceLevel)}</span><span>★ ${item.rating}</span><span>${item.distance_meters} m</span>`;
      tagsHtml = (item.tags || []).map(t => `<span>${t}</span>`).join('');
    } else if (kind === 'clubs') {
      sub = item.category;
      metaHtml = `<span>${item.meetingTime}</span>`;
      tagsHtml = (item.languages || []).map(t => `<span>${t}</span>`).join('');
    } else if (kind === 'services') {
      sub = item.type;
      metaHtml = `<span>${item.distance_meters} m</span>`;
      tagsHtml = (item.tags || []).map(t => `<span>${t}</span>`).join('');
    }

    return `
      <article class="card" data-id="${item.id}" data-kind="${kind}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <h3>${title}</h3>
          <button class="fav-btn" data-fav="${item.id}" aria-label="Toggle favorite">${fav ? '★' : '☆'}</button>
        </div>
        <p class="sub">${sub}</p>
        <div class="meta">${metaHtml}</div>
        <div class="tags">${tagsHtml}</div>
      </article>`;
  }

  function renderCards(container, items, kind) {
    if (!items.length) {
      container.innerHTML = `<div class="empty-state">No results found. Try adjusting your filters.</div>`;
      return;
    }
    container.innerHTML = items.map(item => renderCard(item, kind)).join('');
  }

  function renderModal(item, kind) {
    let html = `<h2>${item.name}</h2><p class="sub">${item.nameEnglish || item.category || item.type || ''}</p><dl>`;
    if (kind === 'restaurants') {
      html += `<dt>Address</dt><dd>${item.address}</dd>
        <dt>Distance</dt><dd>${item.distance_meters} m from campus</dd>
        <dt>Rating</dt><dd>★ ${item.rating}</dd>
        <dt>Price</dt><dd>${priceLabel(item.priceLevel)}</dd>
        <dt>Phone</dt><dd>${item.phone}</dd>
        <dt>Hours</dt><dd>${Object.entries(item.hours || {}).map(([k,v]) => `${k}: ${v}`).join('<br>')}</dd>
        <dt>Notes</dt><dd>${item.notes}</dd>`;
    } else if (kind === 'clubs') {
      html += `<dt>Meeting</dt><dd>${item.meetingTime}</dd>
        <dt>Contact</dt><dd>${item.contact}</dd>
        <dt>Languages</dt><dd>${(item.languages||[]).join(', ')}</dd>
        <dt>Members</dt><dd>${item.members}</dd>
        <dt>About</dt><dd>${item.description}</dd>`;
    } else if (kind === 'services') {
      html += `<dt>Address</dt><dd>${item.address}</dd>
        <dt>Distance</dt><dd>${item.distance_meters} m</dd>
        <dt>Phone</dt><dd>${item.phone}</dd>
        <dt>Hours</dt><dd>${Object.entries(item.hours || {}).map(([k,v]) => `${k}: ${v}`).join('<br>')}</dd>
        <dt>Notes</dt><dd>${item.notes}</dd>`;
    }
    html += `</dl>`;
    return html;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sejong-helper-theme', theme);
    const btn = document.getElementById('darkToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function initTheme() {
    const saved = localStorage.getItem('sejong-helper-theme') || 'light';
    applyTheme(saved);
  }

  return { renderCards, renderModal, toggleFavorite, isFavorite, getFavorites, applyTheme, initTheme };
})();
