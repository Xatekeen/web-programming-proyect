/* map-handler.js — Leaflet map setup, markers and popups */
const MapHandler = (() => {
  let map, markersLayer;

  const ICONS = {
    restaurant: { emoji: '🍜', color: '#b7192b' },
    cafe: { emoji: '☕', color: '#d99a2b' },
    bakery: { emoji: '🥐', color: '#d99a2b' },
    club: { emoji: '🎉', color: '#007a7a' },
    hospital: { emoji: '🏥', color: '#7f1021' },
    clinic: { emoji: '🏥', color: '#7f1021' },
    bank: { emoji: '🏦', color: '#172033' },
    atm: { emoji: '💳', color: '#172033' },
    'convenience-store': { emoji: '🏪', color: '#d99a2b' },
    mart: { emoji: '🛒', color: '#d99a2b' },
    immigration: { emoji: '🛂', color: '#627086' },
    housing: { emoji: '🏠', color: '#b7192b' },
    office: { emoji: '🏢', color: '#172033' },
    default: { emoji: '📍', color: '#b7192b' }
  };

  function init() {
    map = L.map('map').setView([37.5503, 127.0744], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    // Campus marker
    L.marker([37.5503, 127.0744], { title: 'Sejong University' })
      .addTo(map)
      .bindPopup('<strong>Sejong University</strong><br>Main campus gate');
  }

  function makeIcon(typeKey) {
    const conf = ICONS[typeKey] || ICONS.default;
    return L.divIcon({
      html: `<div style="background:${conf.color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);"><span style="transform:rotate(45deg);font-size:14px;">${conf.emoji}</span></div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28]
    });
  }

  function setMarkers(items, onClick) {
    markersLayer.clearLayers();
    items.forEach(item => {
      if (!item.coords) return;
      const typeKey = (Array.isArray(item.type) ? item.type[0] : item.type) || item.category || 'default';
      const marker = L.marker([item.coords.lat, item.coords.lng], { icon: makeIcon(typeKey) });
      const title = item.nameEnglish ? `${item.name} (${item.nameEnglish})` : item.name;
      marker.bindPopup(`<strong>${title}</strong>`);
      marker.on('click', () => onClick && onClick(item));
      marker.addTo(markersLayer);
    });
  }

  function focusOn(item) {
    if (item.coords) map.setView([item.coords.lat, item.coords.lng], 17, { animate: true });
  }

  function invalidateSize() {
    if (map) setTimeout(() => map.invalidateSize(), 200);
  }

  return { init, setMarkers, focusOn, invalidateSize };
})();
