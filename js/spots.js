let spots    = [];
let region   = null;
let area     = null;
let category = 'all';
let expanded = new Set();
let catChips = null;

function filtered() {
  return spots.filter(s => {
    if (!matchesPlace(s, region, area)) return false;
    if (category !== 'all' && s.category !== category) return false;
    return true;
  });
}

function admBadge(s) {
  if (s.admission === 'free') return `<span class="badge-free">${t('spots.free')}</span>`;
  if (s.admission === 'paid') return `<span class="badge-paid">${t('spots.paid')}</span>`;
  return '';
}

function resBadge(s) {
  if (s.reservation === true)            return `<span class="badge-res">${t('spots.res_required')}</span>`;
  if (s.reservation === 'recommended')   return `<span class="badge-res-rec">${t('spots.res_recommended')}</span>`;
  return '';
}

function renderSpots() {
  const list  = document.getElementById('spot-list');
  const items = filtered();

  if (!items.length) {
    list.innerHTML = `<div class="empty-msg">${t('spots.empty')}</div>`;
    return;
  }

  list.innerHTML = items.map(s => {
    const open = expanded.has(s.id);
    return `
      <div class="spot-card" id="card-${s.id}">
        <div class="spot-top">
          <div class="spot-name">${tx(s.name)}</div>
          <div class="spot-badges">${admBadge(s)}${resBadge(s)}</div>
        </div>
        <div class="spot-meta">
          <span class="meta-tag">${catLabel('spot', s.category)}</span>
          <span class="meta-tag">⏰ ${tx(s.hours)}</span>
        </div>
        <div class="spot-price-note">${tx(s.admission_note)}</div>
        <div class="spot-desc">${tx(s.description)}</div>
        ${s.tips?.length ? `
          <div class="spot-tips${open ? '' : ' hidden'}" id="tips-${s.id}">
            ${s.tips.map(tip => `<div class="tip-item">${tx(tip)}</div>`).join('')}
          </div>
          <button class="tips-toggle" data-id="${s.id}">
            ${open ? t('spots.tips_hide') : t('spots.tips_show')}
          </button>
        ` : ''}
        <div class="spot-address">
          <a href="${mapsUrl(s.address)}"
             target="_blank" rel="noopener noreferrer">
            📍 ${s.address}
          </a>
        </div>
      </div>`;
  }).join('');
}

function onGeoChange(sel) {
  region = sel.region;
  area = sel.area;
  category = 'all';
  catChips.reset();
  expanded.clear();
  initWeather('weather-scroll', weatherPoint(region, area));
  renderSpots();
}

function initTipsToggle() {
  document.getElementById('spot-list').addEventListener('click', e => {
    const btn = e.target.closest('.tips-toggle');
    if (!btn) return;
    const id = btn.dataset.id;
    expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    renderSpots();
  });
}

async function init() {
  await loadGeo();
  spots = await loadData('spots.json', 'spots');
  initNationSwitch('nation-switch');
  initLangSwitch('lang-switch');
  catChips = initCatChips('cat-row', 'spot', cat => {
    category = cat;
    renderSpots();
  });
  initTipsToggle();
  initGeoTabs({ includeWeatherOnly: false, onChange: onGeoChange });
}

document.addEventListener('DOMContentLoaded', init);
