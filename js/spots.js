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
  if (s.admission === 'free') return '<span class="badge-free">무료</span>';
  if (s.admission === 'paid') return '<span class="badge-paid">유료</span>';
  return '';
}

function resBadge(s) {
  if (s.reservation === true)            return '<span class="badge-res">예약 필수</span>';
  if (s.reservation === 'recommended')   return '<span class="badge-res-rec">예약 권장</span>';
  return '';
}

function renderSpots() {
  const list  = document.getElementById('spot-list');
  const items = filtered();

  if (!items.length) {
    list.innerHTML = '<div class="empty-msg">등록된 스팟이 없습니다.<br>다른 지역을 선택해보세요.</div>';
    return;
  }

  list.innerHTML = items.map(s => {
    const open = expanded.has(s.id);
    return `
      <div class="spot-card" id="card-${s.id}">
        <div class="spot-top">
          <div class="spot-name">${s.name_ko}</div>
          <div class="spot-badges">${admBadge(s)}${resBadge(s)}</div>
        </div>
        <div class="spot-meta">
          <span class="meta-tag">${catLabel('spot', s.category)}</span>
          <span class="meta-tag">⏰ ${s.hours}</span>
        </div>
        <div class="spot-price-note">${s.admission_note}</div>
        <div class="spot-desc">${s.description_ko}</div>
        ${s.tips?.length ? `
          <div class="spot-tips${open ? '' : ' hidden'}" id="tips-${s.id}">
            ${s.tips.map(t => `<div class="tip-item">${t}</div>`).join('')}
          </div>
          <button class="tips-toggle" data-id="${s.id}">
            ${open ? '▲ 팁 접기' : '▼ 팁 보기'}
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
  catChips = initCatChips('cat-row', 'spot', cat => {
    category = cat;
    renderSpots();
  });
  initTipsToggle();
  initGeoTabs({ includeWeatherOnly: false, onChange: onGeoChange });
}

document.addEventListener('DOMContentLoaded', init);
