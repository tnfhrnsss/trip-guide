let stores   = [];
let region   = null;
let area     = null;
let category = 'all'; // 'all' = 필터 없음 (전체)
let tier     = 'all'; // 가격대 칩
let query    = '';
let catChips = null;
let priceChips = null;

function filtered() {
  const q = query.trim().toLowerCase();
  return stores.filter(s => {
    if (!matchesPlace(s, region, area)) return false;
    if (category !== 'all' && s.category !== category) return false;
    if (tier !== 'all' && priceTierOf(s.coffee_price) !== tier) return false;
    if (q && !searchText(s.name).includes(q) && !s.category.includes(q)
        && !catLabel('store', s.category).toLowerCase().includes(q)) return false;
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
        <div class="store-name">${tx(s.name)}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${s.coffee_price != null ? `<span class="price-tag" title="${t('price.label')}">${coffeePriceLabel(s.coffee_price)}</span>`
            : s.price_range ? `<span class="price-tag">${s.price_range}</span>` : ''}
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
  tier = 'all';
  catChips.reset();
  priceChips.reset();
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
  priceChips = initPriceChips('price-row', id => {
    tier = id;
    renderList();
  });
  initSearch();
  initGeoTabs({ onChange: onGeoChange });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}

document.addEventListener('DOMContentLoaded', init);
