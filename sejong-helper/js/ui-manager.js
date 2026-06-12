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

  function localizedField(item, baseKey) {
    const lang = (typeof SettingsManager !== 'undefined') ? SettingsManager.get().language : 'en';
    const i18nKey = baseKey + '_i18n';
    if (lang !== 'en' && item[i18nKey] && item[i18nKey][lang]) return item[i18nKey][lang];
    return item[baseKey];
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

    const statusHtml = (typeof FeaturesUI !== 'undefined' && item.hours) ? FeaturesUI.statusBadgeHtml(item) : '';
    const avgRev = (typeof ReviewsManager !== 'undefined') ? ReviewsManager.averageRating(item.id) : null;
    const revCount = (typeof ReviewsManager !== 'undefined') ? ReviewsManager.forPlace(item.id).length : 0;
    const revHtml = revCount ? `<span class="review-mini">💬 ${revCount} (${avgRev ? avgRev.toFixed(1) : '—'}★)</span>` : '';

    return `
      <article class="card" data-id="${item.id}" data-kind="${kind}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <h3>${title}</h3>
          <button class="fav-btn" data-fav="${item.id}" aria-label="Toggle favorite">${fav ? '★' : '☆'}</button>
        </div>
        <p class="sub">${sub}</p>
        ${statusHtml ? `<div class="status-row">${statusHtml}${revHtml}</div>` : (revHtml ? `<div class="status-row">${revHtml}</div>` : '')}
        <div class="meta">${metaHtml}</div>
        <div class="tags">${tagsHtml}</div>
      </article>`;
  }

  function renderCards(container, items, kind) {
    if (!items.length) {
      const msg = (typeof SettingsManager !== 'undefined') ? SettingsManager.t('emptyResults') : 'No results found. Try adjusting your filters.';
      container.innerHTML = `<div class="empty-state">${msg}</div>`;
      return;
    }
    container.innerHTML = items.map(item => renderCard(item, kind)).join('');
  }

  function renderModal(item, kind) {
    const t = (typeof SettingsManager !== 'undefined') ? SettingsManager.t : (k) => k;
    let html = `<h2>${item.name}</h2><p class="sub">${item.nameEnglish || item.category || item.type || ''}</p>`;
    if (item.hours && typeof FeaturesUI !== 'undefined') {
      html += `<div class="status-row">${FeaturesUI.statusBadgeHtml(item)}</div>`;
    }
    html += `<dl>`;
    if (kind === 'restaurants') {
      html += `<dt>${t('addr')}</dt><dd>${item.address}</dd>
        <dt>${t('distFromCampus')}</dt><dd>${item.distance_meters} m</dd>
        <dt>${t('ratingLbl')}</dt><dd>★ ${item.rating}</dd>
        <dt>${t('priceLbl')}</dt><dd>${priceLabel(item.priceLevel)}</dd>
        <dt>${t('phoneLbl')}</dt><dd>${item.phone}</dd>
        <dt>${t('hoursLbl')}</dt><dd>${Object.entries(item.hours || {}).map(([k,v]) => `${k}: ${v}`).join('<br>')}</dd>
        <dt>${t('notesLbl')}</dt><dd>${localizedField(item, 'notes')}</dd>`;
    } else if (kind === 'clubs') {
      html += `<dt>${t('meetingLbl')}</dt><dd>${item.meetingTime}</dd>
        <dt>${t('contactLbl')}</dt><dd>${item.contact}</dd>
        <dt>${t('languagesLbl')}</dt><dd>${(item.languages||[]).join(', ')}</dd>
        <dt>${t('membersLbl')}</dt><dd>${item.members}</dd>
        <dt>${t('aboutLbl')}</dt><dd>${localizedField(item, 'description')}</dd>`;
    } else if (kind === 'services') {
      html += `<dt>${t('addr')}</dt><dd>${item.address}</dd>
        <dt>${t('distFromCampus')}</dt><dd>${item.distance_meters} m</dd>
        <dt>${t('phoneLbl')}</dt><dd>${item.phone}</dd>
        <dt>${t('hoursLbl')}</dt><dd>${Object.entries(item.hours || {}).map(([k,v]) => `${k}: ${v}`).join('<br>')}</dd>
        <dt>${t('notesLbl')}</dt><dd>${localizedField(item, 'notes')}</dd>`;
    }
    html += `</dl>`;

    // Collections + personal note
    if (typeof CollectionsManager !== 'undefined') {
      const cols = CollectionsManager.getAll();
      const notes = CollectionsManager.getNotes();
      html += `<div class="modal-extra">
        <label class="modal-note-label">My note
          <textarea class="modal-note" data-note-for="${item.id}" placeholder="Add a personal note...">${notes[item.id] || ''}</textarea>
        </label>
        ${cols.length ? `<label>Save to collection
          <select class="modal-collection-select" data-save-for="${item.id}">
            <option value="">Choose a collection...</option>
            ${cols.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </label>` : `<p class="muted">Create a collection in the Collections tab to save places to lists.</p>`}
      </div>`;
    }

    // Reviews summary
    if (typeof ReviewsManager !== 'undefined') {
      const revs = ReviewsManager.forPlace(item.id);
      const avg = ReviewsManager.averageRating(item.id);
      html += `<div class="modal-reviews">
        <h3>Student Reviews ${avg ? `(★ ${avg.toFixed(1)} avg, ${revs.length})` : ''}</h3>
        ${revs.length ? revs.slice(0,5).map(r => `
          <div class="review-item">
            <div class="review-item-head">
              <span class="badge cat-${r.category}">${r.category}</span>
              ${r.rating ? `<span>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>` : ''}
            </div>
            <p>${r.comment}</p>
            <span class="muted">${r.author} · ${new Date(r.timestamp).toLocaleDateString()}</span>
          </div>`).join('') : `<p class="muted">No reviews yet. Add one from the Reviews tab.</p>`}
      </div>`;
    }
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
