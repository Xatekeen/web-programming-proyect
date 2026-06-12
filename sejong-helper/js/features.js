/* features.js — Open Now, Guides, Collections, Budget, Reviews, Compare, Dashboard, Settings
   All client-side, localStorage-backed, no external APIs. */

/* ---------------------------------------------------------- */
/* HoursUtil — parse the "hours" objects used across the data */
/* ---------------------------------------------------------- */
const HoursUtil = (() => {
  const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat'];

  function expandDays(key) {
    key = key.toLowerCase();
    if (key.includes('-')) {
      const [a, b] = key.split('-');
      const ai = DAY_NAMES.indexOf(a), bi = DAY_NAMES.indexOf(b);
      if (ai === -1 || bi === -1) return null;
      const days = [];
      let i = ai;
      while (true) {
        days.push(i);
        if (i === bi) break;
        i = (i + 1) % 7;
      }
      return days;
    }
    const i = DAY_NAMES.indexOf(key);
    return i === -1 ? null : [i];
  }

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  // Returns {known, open, label, closesInMin, opensAt}
  function getStatus(hours, now = new Date()) {
    if (!hours || !Object.keys(hours).length) return { known: false, open: null, label: 'Hours unavailable' };
    const day = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let entry = null;
    for (const [key, val] of Object.entries(hours)) {
      const days = expandDays(key);
      if (days && days.includes(day)) { entry = val; break; }
    }
    if (!entry) return { known: false, open: null, label: 'Hours unavailable' };

    const val = entry.trim();
    if (/24\s*hours?/i.test(val)) {
      return { known: true, open: true, label: 'Open 24 hours', closesInMin: null };
    }
    if (val === '-' || /check/i.test(val)) {
      return { known: false, open: null, label: 'See app for hours' };
    }

    // Extract break range if present
    let breakRange = null;
    const breakMatch = val.match(/break\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/i);
    if (breakMatch) breakRange = [toMinutes(breakMatch[1]), toMinutes(breakMatch[2])];

    const rangeMatch = val.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!rangeMatch) return { known: false, open: null, label: val };

    let start = toMinutes(rangeMatch[1]);
    let end = toMinutes(rangeMatch[2]);
    const crossesMidnight = end <= start;
    const effectiveEnd = crossesMidnight ? end + 24 * 60 : end;
    const effectiveNow = nowMin < start && crossesMidnight ? nowMin + 24 * 60 : nowMin;

    let open = effectiveNow >= start && effectiveNow < effectiveEnd;

    if (open && breakRange) {
      const [bs, be] = breakRange;
      if (nowMin >= bs && nowMin < be) {
        return { known: true, open: false, label: `On break until ${formatMin(be)}`, opensAt: be };
      }
    }

    if (open) {
      const closesInMin = effectiveEnd - effectiveNow;
      return { known: true, open: true, label: closesInMin <= 60 ? `Closes in ${closesInMin} min` : `Open until ${formatMin(end)}`, closesInMin };
    }
    return { known: true, open: false, label: `Opens at ${formatMin(start)}`, opensAt: start };
  }

  function formatMin(min) {
    min = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(min / 60), m = min % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  return { getStatus };
})();

/* ---------------------------------------------------------- */
/* CollectionsManager — favorites, custom collections, notes  */
/* ---------------------------------------------------------- */
const CollectionsManager = (() => {
  const KEY = 'sejong-helper-collections';
  const NOTES_KEY = 'sejong-helper-notes';
  const COLORS = ['#b7192b','#007a7a','#d99a2b','#7f1021','#3c6e9c','#5a8f3c'];

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function create(name, color) {
    const list = getAll();
    list.push({ id: 'col_' + Date.now(), name, color: color || COLORS[list.length % COLORS.length], places: [] });
    save(list);
    return list;
  }
  function remove(id) { save(getAll().filter(c => c.id !== id)); }
  function addPlace(colId, placeId) {
    const list = getAll();
    const col = list.find(c => c.id === colId);
    if (col && !col.places.includes(placeId)) col.places.push(placeId);
    save(list);
  }
  function removePlace(colId, placeId) {
    const list = getAll();
    const col = list.find(c => c.id === colId);
    if (col) col.places = col.places.filter(p => p !== placeId);
    save(list);
  }

  function getNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; }
    catch { return {}; }
  }
  function setNote(placeId, text) {
    const notes = getNotes();
    if (text) notes[placeId] = text; else delete notes[placeId];
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function exportCollection(col, allItems) {
    const items = allItems.filter(i => col.places.includes(i.id));
    const notes = getNotes();
    let csv = 'Name,Type,Address,Notes\n';
    items.forEach(i => {
      const addr = (i.address || '').replace(/,/g, ';');
      const note = (notes[i.id] || '').replace(/,/g, ';');
      csv += `"${i.name}","${i._kind || ''}","${addr}","${note}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${col.name.replace(/\s+/g,'_')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function shareUrl(col) {
    const payload = encodeURIComponent(JSON.stringify({ n: col.name, p: col.places }));
    return `${location.href.split('#')[0]}#collection=${payload}`;
  }

  return { getAll, create, remove, addPlace, removePlace, getNotes, setNote, exportCollection, shareUrl, COLORS };
})();

/* ---------------------------------------------------------- */
/* ReviewsManager — community reviews/tips/warnings           */
/* ---------------------------------------------------------- */
const ReviewsManager = (() => {
  const KEY = 'sejong-helper-reviews';
  const TAGS = ['vegetarian','wifi','quiet','friendly_staff','quality','speed'];
  const CATEGORIES = ['review','tip','warning','recommendation'];

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function add(review) {
    const list = getAll();
    list.unshift({
      id: 'rev_' + Date.now(),
      placeId: review.placeId,
      author: review.author || 'Anonymous',
      rating: review.rating,
      category: review.category,
      comment: review.comment,
      tags: review.tags || [],
      timestamp: Date.now(),
      helpful: 0
    });
    save(list);
    return list;
  }
  function markHelpful(id) {
    const list = getAll();
    const r = list.find(x => x.id === id);
    if (r) r.helpful = (r.helpful || 0) + 1;
    save(list);
  }
  function forPlace(placeId) { return getAll().filter(r => r.placeId === placeId); }
  function averageRating(placeId) {
    const revs = forPlace(placeId).filter(r => r.rating);
    if (!revs.length) return null;
    return revs.reduce((s, r) => s + r.rating, 0) / revs.length;
  }

  return { getAll, add, markHelpful, forPlace, averageRating, TAGS, CATEGORIES };
})();

/* ---------------------------------------------------------- */
/* SettingsManager                                              */
/* ---------------------------------------------------------- */
const SettingsManager = (() => {
  const KEY = 'sejong-helper-settings';
  const DEFAULTS = { currency: 'KRW', units: 'metric', language: 'en', notifications: false };

  const RATES = { KRW: 1, USD: 1 / 1350, EUR: 1 / 1450 };
  const SYMBOLS = { KRW: '₩', USD: '$', EUR: '€' };

  function get() {
    try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; }
    catch { return { ...DEFAULTS }; }
  }
  function set(patch) {
    const cur = get();
    const next = { ...cur, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  function formatPrice(krw) {
    const s = get();
    const rate = RATES[s.currency] || 1;
    const val = krw * rate;
    const symbol = SYMBOLS[s.currency] || '₩';
    if (s.currency === 'KRW') return `${symbol}${Math.round(val).toLocaleString()}`;
    return `${symbol}${val.toFixed(2)}`;
  }

  const I18N = {
    en: { restaurants:'Restaurants', clubs:'Clubs', services:'Services', favorites:'Favorites',
      guides:'Guides', reviews:'Reviews', budget:'Budget', compare:'Compare', dashboard:'Dashboard',
      collections:'Collections', settings:'Settings', map:'Map',
      tagline:'International Student Guide · Gwangjin-gu, Seoul',
      searchPlaceholder:'Search restaurants, clubs, services...',
      filtersTitle:'Filters', budgetMax:'Budget (max ₩)', any:'Any',
      cuisine:'Cuisine', dietary:'Dietary', openNow:'Open now only',
      anyTime:'Any time', pastMidnight:'Past midnight (00:00-05:00)',
      earlyMorning:'Early morning (06:00-10:00)', lunchHours:'Lunch hours (11:00-14:00)',
      maxDistance:'Max distance', sortBy:'Sort by', sortDistance:'Distance',
      sortRating:'Rating', sortPrice:'Price (low to high)', sortClosing:'Closing soon',
      resetFilters:'Reset filters', results:'results', result:'result',
      emptyResults:'No results found. Try adjusting your filters.',
      noFavorites:'No favorites yet. Tap the ☆ on any item to save it here.',
      chatGreeting:'Hi! Ask me about restaurants, clubs, or services near campus — e.g. "vegan food near campus" or "halal restaurants under ₩₩".',
      chatPlaceholder:'Ask a question...', chatSend:'Send', chatTitle:'Sejong Helper Assistant',
      timeOfDay:'Time of day',
      addr:'Address', distFromCampus:'Distance', ratingLbl:'Rating', priceLbl:'Price',
      phoneLbl:'Phone', hoursLbl:'Hours', notesLbl:'Notes', meetingLbl:'Meeting',
      contactLbl:'Contact', languagesLbl:'Languages', membersLbl:'Members', aboutLbl:'About' },
    eu: { restaurants:'Jatetxeak', clubs:'Klubak', services:'Zerbitzuak', favorites:'Gogokoak',
      guides:'Gidak', reviews:'Iruzkinak', budget:'Aurrekontua', compare:'Konparatu', dashboard:'Laburpena',
      collections:'Bildumak', settings:'Ezarpenak', map:'Mapa',
      tagline:'Nazioarteko Ikasleen Gida · Gwangjin-gu, Seoul',
      searchPlaceholder:'Bilatu jatetxeak, klubak, zerbitzuak...',
      filtersTitle:'Iragazkiak', budgetMax:'Aurrekontua (geh. ₩)', any:'Edozein',
      cuisine:'Sukaldaritza', dietary:'Dieta', openNow:'Orain irekita daudenak',
      anyTime:'Edozein ordu', pastMidnight:'Gauerditik aurrera (00:00-05:00)',
      earlyMorning:'Goizean goiz (06:00-10:00)', lunchHours:'Bazkalordua (11:00-14:00)',
      maxDistance:'Distantzia max.', sortBy:'Ordenatu', sortDistance:'Distantzia',
      sortRating:'Balorazioa', sortPrice:'Prezioa (txikitik handira)', sortClosing:'Laster ixten',
      resetFilters:'Garbitu iragazkiak', results:'emaitza', result:'emaitza',
      emptyResults:'Ez da emaitzarik aurkitu. Aldatu iragazkiak.',
      noFavorites:'Oraindik ez duzu gogokorik. Sakatu ☆ elementu batean gehitzeko.',
      chatGreeting:'Kaixo! Galdetu jatetxe, klub edo zerbitzuei buruz — adib. "halal jatetxeak ₩₩ azpitik".',
      chatPlaceholder:'Idatzi galdera bat...', chatSend:'Bidali', chatTitle:'Sejong Helper Laguntzailea',
      timeOfDay:'Eguneko ordua',
      addr:'Helbidea', distFromCampus:'Distantzia', ratingLbl:'Balorazioa', priceLbl:'Prezioa',
      phoneLbl:'Telefonoa', hoursLbl:'Ordutegia', notesLbl:'Oharrak', meetingLbl:'Bilera',
      contactLbl:'Kontaktua', languagesLbl:'Hizkuntzak', membersLbl:'Kideak', aboutLbl:'Honi buruz' },
    ko: { restaurants:'식당', clubs:'동아리', services:'서비스', favorites:'즐겨찾기',
      guides:'가이드', reviews:'리뷰', budget:'예산', compare:'비교', dashboard:'대시보드',
      collections:'모음', settings:'설정', map:'지도',
      tagline:'국제 학생 가이드 · 서울 광진구',
      searchPlaceholder:'식당, 동아리, 서비스 검색...',
      filtersTitle:'필터', budgetMax:'예산 (최대 ₩)', any:'전체',
      cuisine:'요리 종류', dietary:'식이 옵션', openNow:'현재 영업중만 보기',
      anyTime:'전체 시간', pastMidnight:'자정 이후 (00:00-05:00)',
      earlyMorning:'아침 일찍 (06:00-10:00)', lunchHours:'점심 시간 (11:00-14:00)',
      maxDistance:'최대 거리', sortBy:'정렬', sortDistance:'거리',
      sortRating:'평점', sortPrice:'가격 (낮은순)', sortClosing:'곧 마감',
      resetFilters:'필터 초기화', results:'개 결과', result:'개 결과',
      emptyResults:'결과가 없습니다. 필터를 조정해보세요.',
      noFavorites:'즐겨찾기가 없습니다. 항목의 ☆를 눌러 추가하세요.',
      chatGreeting:'안녕하세요! 캠퍼스 근처 식당, 동아리, 서비스에 대해 물어보세요 — 예: "할랄 음식 추천".',
      chatPlaceholder:'질문을 입력하세요...', chatSend:'전송', chatTitle:'세종 도우미 어시스턴트',
      timeOfDay:'시간대',
      addr:'주소', distFromCampus:'거리', ratingLbl:'평점', priceLbl:'가격',
      phoneLbl:'전화번호', hoursLbl:'영업시간', notesLbl:'참고', meetingLbl:'모임',
      contactLbl:'연락처', languagesLbl:'언어', membersLbl:'회원수', aboutLbl:'소개' },
    zh: { restaurants:'餐厅', clubs:'社团', services:'服务', favorites:'收藏',
      guides:'指南', reviews:'点评', budget:'预算', compare:'对比', dashboard:'概览',
      collections:'收藏夹', settings:'设置', map:'地图',
      tagline:'国际学生指南 · 首尔广津区',
      searchPlaceholder:'搜索餐厅、社团、服务...',
      filtersTitle:'筛选', budgetMax:'预算 (最高 ₩)', any:'不限',
      cuisine:'菜系', dietary:'饮食偏好', openNow:'仅显示营业中',
      anyTime:'任意时间', pastMidnight:'凌晨时段 (00:00-05:00)',
      earlyMorning:'清晨 (06:00-10:00)', lunchHours:'午餐时段 (11:00-14:00)',
      maxDistance:'最大距离', sortBy:'排序', sortDistance:'距离',
      sortRating:'评分', sortPrice:'价格（从低到高）', sortClosing:'即将关闭',
      resetFilters:'重置筛选', results:'个结果', result:'个结果',
      emptyResults:'没有找到结果，请调整筛选条件。',
      noFavorites:'还没有收藏。点击 ☆ 添加到收藏。',
      chatGreeting:'你好！可以问我关于校园附近餐厅、社团或服务的问题 — 例如"附近的清真餐厅"。',
      chatPlaceholder:'输入问题...', chatSend:'发送', chatTitle:'世宗助手',
      timeOfDay:'时间段',
      addr:'地址', distFromCampus:'距离', ratingLbl:'评分', priceLbl:'价格',
      phoneLbl:'电话', hoursLbl:'营业时间', notesLbl:'备注', meetingLbl:'聚会时间',
      contactLbl:'联系方式', languagesLbl:'语言', membersLbl:'成员数', aboutLbl:'简介' },
    vi: { restaurants:'Nhà hàng', clubs:'Câu lạc bộ', services:'Dịch vụ', favorites:'Yêu thích',
      guides:'Hướng dẫn', reviews:'Đánh giá', budget:'Ngân sách', compare:'So sánh', dashboard:'Tổng quan',
      collections:'Bộ sưu tập', settings:'Cài đặt', map:'Bản đồ' },
    ja: { restaurants:'レストラン', clubs:'サークル', services:'サービス', favorites:'お気に入り',
      guides:'ガイド', reviews:'レビュー', budget:'予算', compare:'比較', dashboard:'ダッシュボード',
      collections:'コレクション', settings:'設定', map:'地図' },
    ru: { restaurants:'Рестораны', clubs:'Клубы', services:'Услуги', favorites:'Избранное',
      guides:'Гиды', reviews:'Отзывы', budget:'Бюджет', compare:'Сравнить', dashboard:'Обзор',
      collections:'Коллекции', settings:'Настройки', map:'Карта' },
    mn: { restaurants:'Рестораны', clubs:'Клубууд', services:'Үйлчилгээ', favorites:'Дуртай',
      guides:'Гарын авлага', reviews:'Сэтгэгдэл', budget:'Төсөв', compare:'Харьцуулах', dashboard:'Хянах самбар',
      collections:'Цуглуулга', settings:'Тохиргоо', map:'Газрын зураг' },
    uz: { restaurants:'Restoranlar', clubs:'Klublar', services:'Xizmatlar', favorites:'Sevimlilar',
      guides:'Qoʻllanmalar', reviews:'Sharhlar', budget:'Byudjet', compare:'Solishtirish', dashboard:'Boshqaruv paneli',
      collections:'Toʻplamlar', settings:'Sozlamalar', map:'Xarita' },
    ar: { restaurants:'مطاعم', clubs:'أندية', services:'خدمات', favorites:'المفضلة',
      guides:'أدلة', reviews:'تقييمات', budget:'الميزانية', compare:'مقارنة', dashboard:'لوحة المعلومات',
      collections:'مجموعات', settings:'الإعدادات', map:'الخريطة' }
  };
  function t(key) {
    const lang = get().language;
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  return { get, set, formatPrice, t, DEFAULTS };
})();

/* ---------------------------------------------------------- */
/* Price helpers — approximate KRW cost per priceLevel         */
/* ---------------------------------------------------------- */
const PriceUtil = (() => {
  const LEVEL_KRW = { 1: 4500, 2: 9000, 3: 16000, 4: 28000 };
  function mealCost(item) { return LEVEL_KRW[item.priceLevel] || LEVEL_KRW[1]; }
  return { LEVEL_KRW, mealCost };
})();

/* ---------------------------------------------------------- */
/* FeaturesUI — renders the non-map tabs into a container      */
/* ---------------------------------------------------------- */
const FeaturesUI = (() => {

  /* ---------- Guides ---------- */
  function renderGuides(container, data, query) {
    const guides = (data.guides || []);
    const q = (query || '').toLowerCase().trim();
    let html = `<div class="guides-wrap">`;
    guides.forEach(cat => {
      const items = cat.items.filter(it => !q ||
        it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q));
      if (!items.length) return;
      html += `<section class="guide-category">
        <h3>${cat.icon} ${cat.title}</h3>
        <div class="accordion">
          ${items.map((it, i) => `
            <details class="accordion-item">
              <summary>${it.q}</summary>
              <div class="accordion-body">${it.a}</div>
            </details>`).join('')}
        </div>
      </section>`;
    });
    html += `</div>
      <div class="guides-actions"><button class="text-btn" id="printGuides">🖨️ Print guides</button></div>`;
    container.innerHTML = html;
    const printBtn = container.querySelector('#printGuides');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  }

  /* ---------- Open-Now badge (used by ui-manager via hook) ---------- */
  function statusBadgeHtml(item) {
    if (!item.hours) return '';
    const st = HoursUtil.getStatus(item.hours);
    if (!st.known) return '';
    const cls = st.open ? 'badge-open' : 'badge-closed';
    return `<span class="status-badge ${cls}">${st.open ? '🟢' : '🔴'} ${st.label}</span>`;
  }

  /* ---------- Collections ---------- */
  function renderCollections(container, allItems, onChange) {
    const cols = CollectionsManager.getAll();
    const notes = CollectionsManager.getNotes();
    let html = `<div class="collections-wrap">
      <form class="new-collection-form" id="newCollectionForm">
        <input type="text" id="newCollectionName" placeholder="New collection name (e.g. Cheap eats)" required>
        <button type="submit">+ Create</button>
      </form>
      <div class="collections-grid">`;

    if (!cols.length) {
      html += `<div class="empty-state">No collections yet. Create one above, then add places from any card's "Save to..." option.</div>`;
    }

    cols.forEach(col => {
      const places = allItems.filter(i => col.places.includes(i.id));
      html += `<div class="collection-card" style="border-top:4px solid ${col.color}">
        <div class="collection-header">
          <h3>${col.name}</h3>
          <div class="collection-actions">
            <button class="text-btn" data-export="${col.id}">Export CSV</button>
            <button class="text-btn" data-share="${col.id}">Share link</button>
            <button class="text-btn danger" data-remove-col="${col.id}">Delete</button>
          </div>
        </div>
        <p class="muted">${places.length} place${places.length===1?'':'s'}</p>
        <ul class="collection-list">
          ${places.map(p => `
            <li>
              <span>${p.name}</span>
              <button class="text-btn" data-remove-place="${col.id}|${p.id}">Remove</button>
            </li>`).join('') || '<li class="muted">No places added yet.</li>'}
        </ul>
        <div class="collection-add">
          <select data-add-to="${col.id}">
            <option value="">+ Add a place...</option>
            ${allItems.filter(i => !col.places.includes(i.id)).map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
          </select>
        </div>
      </div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;

    container.querySelector('#newCollectionForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = container.querySelector('#newCollectionName');
      if (input.value.trim()) {
        CollectionsManager.create(input.value.trim());
        onChange();
      }
    });
    container.querySelectorAll('[data-export]').forEach(btn => btn.addEventListener('click', () => {
      const col = CollectionsManager.getAll().find(c => c.id === btn.dataset.export);
      if (col) CollectionsManager.exportCollection(col, allItems);
    }));
    container.querySelectorAll('[data-share]').forEach(btn => btn.addEventListener('click', () => {
      const col = CollectionsManager.getAll().find(c => c.id === btn.dataset.share);
      if (col) {
        const url = CollectionsManager.shareUrl(col);
        navigator.clipboard?.writeText(url).catch(() => {});
        alert('Share link copied to clipboard:\n' + url);
      }
    }));
    container.querySelectorAll('[data-remove-col]').forEach(btn => btn.addEventListener('click', () => {
      CollectionsManager.remove(btn.dataset.removeCol);
      onChange();
    }));
    container.querySelectorAll('[data-remove-place]').forEach(btn => btn.addEventListener('click', () => {
      const [colId, placeId] = btn.dataset.removePlace.split('|');
      CollectionsManager.removePlace(colId, placeId);
      onChange();
    }));
    container.querySelectorAll('[data-add-to]').forEach(sel => sel.addEventListener('change', () => {
      if (sel.value) {
        CollectionsManager.addPlace(sel.dataset.addTo, sel.value);
        onChange();
      }
    }));
  }

  /* ---------- Budget Calculator ---------- */
  function renderBudget(container, data, prevState) {
    const restaurants = data.restaurants || [];
    const sorted = [...restaurants].sort((a,b) => PriceUtil.mealCost(a) - PriceUtil.mealCost(b));
    const cheapest = sorted[0];
    const priciest = sorted[sorted.length - 1];
    const avgCost = restaurants.reduce((s,r) => s + PriceUtil.mealCost(r), 0) / restaurants.length;

    const budget = prevState?.budget ?? 600000; // monthly food+misc budget in KRW
    const housing = prevState?.housing ?? 450000;
    const transport = prevState?.transport ?? 60000;

    const mealsPerMonth = 90; // 3/day
    const cheapestTotal = PriceUtil.mealCost(cheapest) * mealsPerMonth;
    const avgTotal = Math.round(avgCost * mealsPerMonth);
    const priciestTotal = PriceUtil.mealCost(priciest) * mealsPerMonth;

    const remaining = budget - housing - transport;
    const mealsAffordable = Math.max(0, Math.floor(remaining / avgCost));

    // Cheapest combo within remaining budget: pick cheapest restaurants until budget exhausted (1 meal each, repeat)
    const comboList = [...sorted].filter(r => PriceUtil.mealCost(r) <= remaining);
    const savingsVsAvg = Math.max(0, avgTotal - cheapestTotal);

    const total = housing + transport + avgTotal;
    const pct = (v) => Math.round((v / total) * 100);

    container.innerHTML = `
      <div class="budget-wrap">
        <h3>💰 Monthly Budget Calculator</h3>
        <div class="budget-sliders">
          <label>Total monthly budget: <strong id="budgetVal">${SettingsManager.formatPrice(budget)}</strong>
            <input type="range" id="budgetSlider2" min="300000" max="1500000" step="10000" value="${budget}">
          </label>
          <label>Housing: <strong id="housingVal">${SettingsManager.formatPrice(housing)}</strong>
            <input type="range" id="housingSlider" min="0" max="1000000" step="10000" value="${housing}">
          </label>
          <label>Transport: <strong id="transportVal">${SettingsManager.formatPrice(transport)}</strong>
            <input type="range" id="transportSlider" min="0" max="200000" step="5000" value="${transport}">
          </label>
        </div>

        <div class="budget-breakdown">
          <div class="budget-pie" style="background: conic-gradient(
            var(--green) 0% ${pct(housing)}%,
            var(--blue) ${pct(housing)}% ${pct(housing)+pct(transport)}%,
            var(--gold) ${pct(housing)+pct(transport)}% 100%);">
            <div class="budget-pie-center">${SettingsManager.formatPrice(total)}<br><span>est. /month</span></div>
          </div>
          <ul class="budget-legend">
            <li><span class="dot" style="background:var(--green)"></span> Housing — ${SettingsManager.formatPrice(housing)} (${pct(housing)}%)</li>
            <li><span class="dot" style="background:var(--blue)"></span> Transport — ${SettingsManager.formatPrice(transport)} (${pct(transport)}%)</li>
            <li><span class="dot" style="background:var(--gold)"></span> Food (avg) — ${SettingsManager.formatPrice(avgTotal)} (${pct(avgTotal)}%)</li>
          </ul>
        </div>

        <div class="budget-stats cards-grid">
          <div class="card stat-card"><h4>Eating at cheapest spots</h4><p class="stat-value">${SettingsManager.formatPrice(cheapestTotal)}/mo</p><p class="muted">e.g. ${cheapest.name} (${SettingsManager.formatPrice(PriceUtil.mealCost(cheapest))}/meal)</p></div>
          <div class="card stat-card"><h4>Eating at average price</h4><p class="stat-value">${SettingsManager.formatPrice(avgTotal)}/mo</p><p class="muted">~${SettingsManager.formatPrice(Math.round(avgCost))}/meal across ${restaurants.length} places</p></div>
          <div class="card stat-card"><h4>Eating at priciest spots</h4><p class="stat-value">${SettingsManager.formatPrice(priciestTotal)}/mo</p><p class="muted">e.g. ${priciest.name} (${SettingsManager.formatPrice(PriceUtil.mealCost(priciest))}/meal)</p></div>
          <div class="card stat-card highlight"><h4>💡 Suggestion</h4><p class="stat-value">Save ${SettingsManager.formatPrice(savingsVsAvg)}/mo</p><p class="muted">Switching from average-priced spots to budget options like ${cheapest.name} could save you ~${SettingsManager.formatPrice(savingsVsAvg)} per month.</p></div>
          <div class="card stat-card"><h4>With your remaining budget</h4><p class="stat-value">~${mealsAffordable} meals/mo</p><p class="muted">${SettingsManager.formatPrice(Math.max(0,remaining))} left after housing & transport, at avg meal price.</p></div>
        </div>

        <h4>Cheapest meal options within your remaining budget per meal (${SettingsManager.formatPrice(Math.max(0,remaining))})</h4>
        <div class="cards-grid combo-grid">
          ${comboList.slice(0, 6).map(r => `
            <div class="card stat-card">
              <h4>${r.name}</h4>
              <p class="stat-value">${SettingsManager.formatPrice(PriceUtil.mealCost(r))}</p>
              <p class="muted">${r.distance_meters} m · ★ ${r.rating}</p>
            </div>`).join('') || '<p class="muted">Increase your budget to see suggestions.</p>'}
        </div>
      </div>`;

    const sync = () => {
      const b = +container.querySelector('#budgetSlider2').value;
      const h = +container.querySelector('#housingSlider').value;
      const t = +container.querySelector('#transportSlider').value;
      container.querySelector('#budgetVal').textContent = SettingsManager.formatPrice(b);
      container.querySelector('#housingVal').textContent = SettingsManager.formatPrice(h);
      container.querySelector('#transportVal').textContent = SettingsManager.formatPrice(t);
      return { budget: b, housing: h, transport: t };
    };
    ['budgetSlider2','housingSlider','transportSlider'].forEach(id => {
      container.querySelector('#' + id).addEventListener('input', () => {
        const next = sync();
        prevState.budget = next.budget; prevState.housing = next.housing; prevState.transport = next.transport;
        renderBudget(container, data, prevState);
      });
    });
  }

  /* ---------- Reviews ---------- */
  function renderReviews(container, allItems, filterState) {
    const reviews = ReviewsManager.getAll();
    const filters = filterState || {};
    const filtered = reviews.filter(r => {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.minRating && (r.rating || 0) < filters.minRating) return false;
      if (filters.kind) {
        const place = allItems.find(i => i.id === r.placeId);
        if (!place || place._kind !== filters.kind) return false;
      }
      return true;
    });

    const placeOptions = allItems.map(i => `<option value="${i.id}">${i.name}</option>`).join('');

    container.innerHTML = `
      <div class="reviews-wrap">
        <h3>⭐ Student Reviews & Tips</h3>
        <form class="review-form" id="reviewForm">
          <div class="review-form-row">
            <select id="revPlace" required>${`<option value="">Select a place...</option>` + placeOptions}</select>
            <select id="revCategory">
              ${ReviewsManager.CATEGORIES.map(c => `<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}
            </select>
            <select id="revRating">
              ${[5,4,3,2,1].map(n => `<option value="${n}">${'★'.repeat(n)}${'☆'.repeat(5-n)}</option>`).join('')}
            </select>
          </div>
          <textarea id="revComment" placeholder="Share a tip, review, or warning..." required></textarea>
          <div class="checkbox-grid">
            ${ReviewsManager.TAGS.map(t => `<label><input type="checkbox" value="${t}" name="revTag"> ${t.replace('_',' ')}</label>`).join('')}
          </div>
          <input type="text" id="revAuthor" placeholder="Your name (optional)">
          <button type="submit">Post</button>
        </form>

        <div class="review-filters">
          <select id="filterCategory"><option value="">All categories</option>${ReviewsManager.CATEGORIES.map(c => `<option value="${c}" ${filters.category===c?'selected':''}>${c}</option>`).join('')}</select>
          <select id="filterRating"><option value="">Any rating</option>${[5,4,3,2,1].map(n => `<option value="${n}" ${filters.minRating==n?'selected':''}>${n}+ ★</option>`).join('')}</select>
          <select id="filterKind"><option value="">All types</option>
            <option value="restaurants" ${filters.kind==='restaurants'?'selected':''}>Restaurants</option>
            <option value="clubs" ${filters.kind==='clubs'?'selected':''}>Clubs</option>
            <option value="services" ${filters.kind==='services'?'selected':''}>Services</option>
          </select>
        </div>

        <div class="review-feed">
          ${filtered.length ? filtered.map(r => {
            const place = allItems.find(i => i.id === r.placeId);
            return `<div class="review-item">
              <div class="review-item-head">
                <strong>${place ? place.name : r.placeId}</strong>
                <span class="badge cat-${r.category}">${r.category}</span>
                ${r.rating ? `<span>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>` : ''}
              </div>
              <p>${r.comment}</p>
              <div class="tags">${(r.tags||[]).map(t => `<span>${t.replace('_',' ')}</span>`).join('')}</div>
              <div class="review-item-foot">
                <span class="muted">${r.author} · ${new Date(r.timestamp).toLocaleDateString()}</span>
                <button class="text-btn" data-helpful="${r.id}">👍 Helpful (${r.helpful || 0})</button>
              </div>
            </div>`;
          }).join('') : '<div class="empty-state">No reviews yet — be the first to share a tip!</div>'}
        </div>
      </div>`;

    container.querySelector('#reviewForm').addEventListener('submit', e => {
      e.preventDefault();
      const placeId = container.querySelector('#revPlace').value;
      if (!placeId) return;
      const tags = [...container.querySelectorAll('input[name="revTag"]:checked')].map(c => c.value);
      ReviewsManager.add({
        placeId,
        author: container.querySelector('#revAuthor').value.trim() || 'Anonymous',
        rating: +container.querySelector('#revRating').value,
        category: container.querySelector('#revCategory').value,
        comment: container.querySelector('#revComment').value.trim(),
        tags
      });
      renderReviews(container, allItems, filters);
    });
    container.querySelector('#filterCategory').addEventListener('change', e => {
      filters.category = e.target.value || undefined;
      renderReviews(container, allItems, filters);
    });
    container.querySelector('#filterRating').addEventListener('change', e => {
      filters.minRating = e.target.value ? +e.target.value : undefined;
      renderReviews(container, allItems, filters);
    });
    container.querySelector('#filterKind').addEventListener('change', e => {
      filters.kind = e.target.value || undefined;
      renderReviews(container, allItems, filters);
    });
    container.querySelectorAll('[data-helpful]').forEach(btn => btn.addEventListener('click', () => {
      ReviewsManager.markHelpful(btn.dataset.helpful);
      renderReviews(container, allItems, filters);
    }));
  }

  /* ---------- Compare ---------- */
  function renderCompare(container, allItems, selected) {
    selected = selected || [];
    const options = allItems.map(i => `<option value="${i.id}" ${selected.includes(i.id)?'selected':''}>${i.name} (${i._kind})</option>`).join('');
    const items = allItems.filter(i => selected.includes(i.id)).slice(0, 4);

    let best = {};
    if (items.length) {
      best.cheapest = items.reduce((a,b) => (b.priceLevel||9) < (a.priceLevel||9) ? b : a);
      best.closest = items.reduce((a,b) => (b.distance_meters??1e9) < (a.distance_meters??1e9) ? b : a);
      best.rated = items.reduce((a,b) => (b.rating||0) > (a.rating||0) ? b : a);
    }

    container.innerHTML = `
      <div class="compare-wrap">
        <h3>🔄 Compare Places</h3>
        <label>Select 2-4 places to compare:
          <select id="compareSelect" multiple size="6">${options}</select>
        </label>
        ${items.length >= 2 ? `
        <div class="compare-table-wrap">
          <table class="compare-table">
            <tr><th></th>${items.map(i => `<th>${i.name}</th>`).join('')}</tr>
            <tr><td>Type</td>${items.map(i => `<td>${i._kind}</td>`).join('')}</tr>
            <tr><td>Distance</td>${items.map(i => `<td class="${best.closest===i?'best-cell':''}">${i.distance_meters ?? '—'} m</td>`).join('')}</tr>
            <tr><td>Walk time (~)</td>${items.map(i => `<td>${i.distance_meters ? Math.max(1,Math.round(i.distance_meters/80)) + ' min' : '—'}</td>`).join('')}</tr>
            <tr><td>Rating</td>${items.map(i => `<td class="${best.rated===i?'best-cell':''}">${i.rating ? '★ '+i.rating : '—'}</td>`).join('')}</tr>
            <tr><td>Price</td>${items.map(i => `<td class="${best.cheapest===i?'best-cell':''}">${i.priceLevel ? '₩'.repeat(i.priceLevel) : '—'}</td>`).join('')}</tr>
            <tr><td>Open now</td>${items.map(i => { const st = i.hours ? HoursUtil.getStatus(i.hours) : {known:false}; return `<td>${st.known ? (st.open ? '🟢 Yes' : '🔴 No') : '—'}</td>`; }).join('')}</tr>
            <tr><td>Cuisine / Tags</td>${items.map(i => `<td>${(i.cuisine || i.tags || []).slice(0,4).join(', ') || '—'}</td>`).join('')}</tr>
          </table>
        </div>
        <div class="compare-summary">
          <p>💰 Best for budget: <strong>${best.cheapest.name}</strong></p>
          <p>📍 Closest to campus: <strong>${best.closest.name}</strong></p>
          <p>⭐ Highest rated: <strong>${best.rated.name}</strong></p>
        </div>
        <button class="text-btn" id="exportCompare">📷 Export as image</button>
        ` : `<div class="empty-state">Select at least 2 places to compare (hold Ctrl/Cmd to select multiple).</div>`}
      </div>`;

    container.querySelector('#compareSelect').addEventListener('change', e => {
      const vals = [...e.target.selectedOptions].map(o => o.value).slice(0, 4);
      renderCompare(container, allItems, vals);
    });
    const exportBtn = container.querySelector('#exportCompare');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      alert('Tip: use your browser\'s screenshot tool, or print this page (Ctrl/Cmd+P) to save the comparison as an image/PDF.');
    });
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard(container, data, onFilter) {
    const restaurants = data.restaurants || [];
    const services = data.services || [];
    const all = [...restaurants, ...services];

    const cheapest = [...restaurants].sort((a,b) => PriceUtil.mealCost(a)-PriceUtil.mealCost(b))[0];
    const closest = [...all].sort((a,b) => (a.distance_meters??1e9)-(b.distance_meters??1e9))[0];
    const highestRated = [...restaurants].sort((a,b) => (b.rating||0)-(a.rating||0))[0];

    // latest open: compute closing time today, pick max effective end
    let latest = null, latestEnd = -1;
    restaurants.forEach(r => {
      Object.values(r.hours || {}).forEach(v => {
        if (/24\s*hours?/i.test(v)) { if (1440 > latestEnd) { latestEnd = 1440; latest = r; } return; }
        const m = v.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (m) {
          let end = HoursUtil ? (() => { const [h,mi]=m[2].split(':').map(Number); return h*60+mi; })() : 0;
          const [sh,smi] = m[1].split(':').map(Number); const start = sh*60+smi;
          if (end <= start) end += 1440;
          if (end > latestEnd) { latestEnd = end; latest = r; }
        }
      });
    });

    const vegCounts = restaurants.map(r => ({ r, n: (r.dietary||[]).filter(d => d.includes('vegetarian') || d.includes('vegan')).length }))
      .filter(x => x.n > 0).sort((a,b) => b.n-a.n);
    const mostVeg = vegCounts[0];

    const wifiPlaces = ReviewsManager.getAll().filter(rv => (rv.tags||[]).includes('wifi'));
    const wifiCounts = {};
    wifiPlaces.forEach(rv => wifiCounts[rv.placeId] = (wifiCounts[rv.placeId]||0)+1);
    const topWifi = Object.entries(wifiCounts).sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([id]) => all.find(i => i.id === id)).filter(Boolean);

    function statCard(emoji, title, value, sub, query) {
      return `<div class="card stat-card clickable" data-query="${query || ''}">
        <h4>${emoji} ${title}</h4>
        <p class="stat-value">${value}</p>
        <p class="muted">${sub || ''}</p>
      </div>`;
    }

    container.innerHTML = `
      <div class="dashboard-wrap">
        <h3>📊 Quick Facts Dashboard</h3>
        <div class="cards-grid">
          ${statCard('💸','Cheapest meal', cheapest.name, SettingsManager.formatPrice(PriceUtil.mealCost(cheapest)), cheapest.name)}
          ${statCard('📍','Closest to campus', closest.name, `${closest.distance_meters} m away`, closest.name)}
          ${statCard('⭐','Highest rated', highestRated.name, `★ ${highestRated.rating}`, highestRated.name)}
          ${latest ? statCard('🌙','Latest open', latest.name, latestEnd>=1440 ? 'Open 24 hours' : `Until ${HoursUtilFormat(latestEnd)}`, latest.name) : ''}
          ${mostVeg ? statCard('🥗','Most vegetarian options', mostVeg.r.name, `${mostVeg.n} dietary tags`, mostVeg.r.name) : statCard('🥗','Vegetarian options', '—','Check the dietary filter')}
          ${statCard('📶','Top WiFi spots (from reviews)', topWifi.length ? topWifi.map(p=>p.name).join(', ') : 'No reviews yet', topWifi.length ? '' : 'Tag a review with "wifi" to populate this', topWifi[0]?.name || '')}
          ${statCard('🍽️','Total restaurants', restaurants.length, 'on & off campus', '')}
          ${statCard('🏥','Total services', services.length, 'banks, marts, clinics & more', '')}
        </div>
      </div>`;

    container.querySelectorAll('.clickable').forEach(card => card.addEventListener('click', () => {
      const q = card.dataset.query;
      if (q && onFilter) onFilter(q);
    }));
  }
  function HoursUtilFormat(min) {
    min = min % 1440;
    const h = Math.floor(min/60), m = min%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  /* ---------- Settings ---------- */
  function renderSettings(container, onChange) {
    const s = SettingsManager.get();
    container.innerHTML = `
      <div class="settings-wrap">
        <h3>⚙️ Settings</h3>
        <div class="settings-grid">
          <label>Currency
            <select id="setCurrency">
              <option value="KRW" ${s.currency==='KRW'?'selected':''}>₩ Korean Won (KRW)</option>
              <option value="USD" ${s.currency==='USD'?'selected':''}>$ US Dollar (USD)</option>
              <option value="EUR" ${s.currency==='EUR'?'selected':''}>€ Euro (EUR)</option>
            </select>
          </label>
          <label>Temperature units
            <select id="setUnits">
              <option value="metric" ${s.units==='metric'?'selected':''}>Celsius (°C)</option>
              <option value="imperial" ${s.units==='imperial'?'selected':''}>Fahrenheit (°F)</option>
            </select>
          </label>
          <label>Language
            <select id="setLanguage">
              <option value="en" ${s.language==='en'?'selected':''}>English</option>
              <option value="ko" ${s.language==='ko'?'selected':''}>한국어</option>
              <option value="zh" ${s.language==='zh'?'selected':''}>中文</option>
              <option value="vi" ${s.language==='vi'?'selected':''}>Tiếng Việt</option>
              <option value="ja" ${s.language==='ja'?'selected':''}>日本語</option>
              <option value="ru" ${s.language==='ru'?'selected':''}>Русский</option>
              <option value="mn" ${s.language==='mn'?'selected':''}>Монгол</option>
              <option value="uz" ${s.language==='uz'?'selected':''}>O'zbek</option>
              <option value="ar" ${s.language==='ar'?'selected':''}>العربية</option>
              <option value="eu" ${s.language==='eu'?'selected':''}>Euskara</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="setNotifications" ${s.notifications?'checked':''}>
            Enable "open now" notifications (in-app only)
          </label>
        </div>
        <p class="muted">Settings are saved locally on this device.</p>
      </div>`;

    ['setCurrency','setUnits','setLanguage','setNotifications'].forEach(id => {
      container.querySelector('#' + id).addEventListener('change', e => {
        const key = { setCurrency:'currency', setUnits:'units', setLanguage:'language', setNotifications:'notifications' }[id];
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        SettingsManager.set({ [key]: value });
        onChange();
      });
    });
  }

  return {
    renderGuides, renderCollections, renderBudget, renderReviews, renderCompare,
    renderDashboard, renderSettings, statusBadgeHtml
  };
})();
