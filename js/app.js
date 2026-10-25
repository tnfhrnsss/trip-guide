let stores   = [];
let region   = null;
let area     = null;
let category = 'all'; // 'all' = 필터 없음 (전체)
let query    = '';
let catChips = null;

function filtered() {
  const q = query.trim().toLowerCase();
  return stores.filter(s => {
    if (!matchesPlace(s, region, area)) return false;
    if (category !== 'all' && s.category !== category) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderList() {
  const list = document.getElementById('store-list');
  const items = filtered();
  if (!items.length) {
    list.innerHTML = `<div class="empty-msg">${t('food.empty')}</div>`;
    return;
  }
  list.innerHTML = items.map(s => `
    <a class="store-card" href="store.html?nation=${Geo.nation.id}&id=${s.id}">
      <div class="store-card-top">
        <div class="store-name">${s.name}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${s.price_range ? `<span class="price-tag">${s.price_range}</span>` : ''}
          <div class="cat-tag">${catLabel('store', s.category)}</div>
        </div>
      </div>
      <div class="store-desc">${tx(s.description)}</div>
      <div class="store-meta">
        <span class="meta-tag">📍 ${placeName(s)}</span>
        ${s.tip_expected ? `<span class="meta-tag" title="${t('tag.tip_title')}">${t('tag.tip')}</span>` : ''}
        ${s.has_seating  ? `<span class="meta-tag" title="${t('tag.seating_title')}">🪑</span>` : ''}
      </div>
    </a>
  `).join('');
}

function onGeoChange(sel) {
  region = sel.region;
  area = sel.area;
  category = 'all';
  catChips.reset();
  initWeather('weather-scroll', weatherPoint(region, area));
  document.getElementById('store-section').classList.toggle('hidden', !!region.weather_only);
  if (!region.weather_only) renderList();
}

function initSearch() {
  document.getElementById('search-input').addEventListener('input', e => {
    query = e.target.value;
    renderList();
  });
}

async function init() {
  await loadGeo();
  stores = await loadData('stores.json', 'stores');
  initNationSwitch('nation-switch');
  initLangSwitch('lang-switch');
  catChips = initCatChips('cat-row', 'store', cat => {
    category = cat;
    renderList();
  });
  initSearch();
  initGeoTabs({ onChange: onGeoChange });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}

document.addEventListener('DOMContentLoaded', init);
