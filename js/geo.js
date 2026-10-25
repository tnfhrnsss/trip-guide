'use strict';

// 국가 → 지역 → 구역 공용 로직. 모든 페이지가 다른 스크립트보다 먼저 로드한다.
const Geo = { nations: [], nation: null, regions: [] };

function storageGet(storage, key) {
  try { return storage.getItem(key); } catch (_) { return null; }
}
function storageSet(storage, key, value) {
  try { storage.setItem(key, value); } catch (_) {}
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url}`);
  return res.json();
}

// ?nation= 파라미터 > 저장된 국가 > 첫 번째 국가
async function loadGeo() {
  Geo.nations = (await fetchJson('data/nations.json')).nations;
  const param = new URLSearchParams(location.search).get('nation');
  const saved = storageGet(localStorage, 'trip_nation');
  Geo.nation = Geo.nations.find(n => n.id === param)
    || Geo.nations.find(n => n.id === saved)
    || Geo.nations[0];
  storageSet(localStorage, 'trip_nation', Geo.nation.id);
  Geo.regions = (await fetchJson(dataUrl('regions.json'))).regions;
  return Geo;
}

function dataUrl(file) {
  return `data/${Geo.nation.id}/${file}`;
}

async function loadData(file, key) {
  return (await fetchJson(dataUrl(file)))[key];
}

function setNation(id) {
  storageSet(localStorage, 'trip_nation', id);
  location.href = location.pathname;
}

function findRegion(id) {
  return Geo.regions.find(r => r.id === id) || null;
}

function regionName(id) {
  return findRegion(id)?.name || id;
}

// 카드에 표시할 위치명: 구역이 있으면 구역명, 없으면 지역명
function placeName(item) {
  const area = findRegion(item.region)?.areas.find(a => a.id === item.area);
  return area?.name || regionName(item.region);
}

// ── 카테고리 (국가 설정의 store_categories / spot_categories) ──
function catInfo(kind, id) {
  const list = Geo.nation[`${kind}_categories`] || [];
  return list.find(c => c.id === id) || { id, label: id, emoji: '📍' };
}

function catLabel(kind, id) {
  const c = catInfo(kind, id);
  return `${c.emoji} ${c.label}`;
}

// ── 지도 링크 (국가 설정의 maps) ──
function mapsUrl(query) {
  if (Geo.nation?.maps === 'naver') {
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  }
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

// 구역에 날씨 지점이 있으면 그걸, 없으면 지역 날씨 지점을 쓴다
function weatherPoint(region, area) {
  const w = area?.weather || region.weather;
  if (!w) return null;
  const key = `${Geo.nation.id}_${area?.weather ? area.id : region.id}`;
  return { key, name: w.name, lat: w.lat, lng: w.lng, timezone: region.timezone };
}

// 구역이 선택되면 구역 id로만 비교한다 (여러 지역에 걸친 구역 대응)
function matchesPlace(item, region, area) {
  if (area) return item.area === area.id;
  return item.region === region.id;
}

// ── 지역 탭 + 구역 칩 ──
function selectionKey() {
  return `trip_sel_${Geo.nation.id}`;
}

function loadSelection(regions) {
  let saved = null;
  try { saved = JSON.parse(storageGet(sessionStorage, selectionKey()) || 'null'); } catch (_) {}
  const region = regions.find(r => r.id === saved?.region) || regions[0];
  const area = region.areas.find(a => a.id === saved?.area) || region.areas[0] || null;
  return { region, area };
}

function saveSelection(sel) {
  storageSet(sessionStorage, selectionKey(),
    JSON.stringify({ region: sel.region.id, area: sel.area?.id || null }));
}

// onChange({ region, area })를 처음 한 번, 그리고 선택이 바뀔 때마다 호출
function initGeoTabs({ includeWeatherOnly = true, onChange }) {
  const regions = Geo.regions.filter(r => includeWeatherOnly || !r.weather_only);
  const tabsEl = document.getElementById('region-tabs');
  const areasEl = document.getElementById('area-chips');
  const sel = loadSelection(regions);

  function renderTabs() {
    tabsEl.innerHTML = regions.map(r => `
      <button class="region-tab${r === sel.region ? ' active' : ''}" data-region="${r.id}">${r.name}</button>
    `).join('');
  }

  function renderAreas() {
    const areas = sel.region.areas;
    areasEl.classList.toggle('hidden', areas.length < 2);
    areasEl.innerHTML = areas.map(a => `
      <button class="area-chip${a === sel.area ? ' active' : ''}" data-area="${a.id}">${a.name}</button>
    `).join('');
  }

  function changed() {
    saveSelection(sel);
    renderTabs();
    renderAreas();
    onChange({ region: sel.region, area: sel.area });
  }

  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('.region-tab');
    if (!btn || btn.dataset.region === sel.region.id) return;
    sel.region = regions.find(r => r.id === btn.dataset.region);
    sel.area = sel.region.areas[0] || null;
    changed();
  });

  areasEl.addEventListener('click', e => {
    const btn = e.target.closest('.area-chip');
    if (!btn || btn.dataset.area === sel.area?.id) return;
    sel.area = sel.region.areas.find(a => a.id === btn.dataset.area);
    changed();
  });

  changed();
}

// ── 카테고리 칩 ──
function initCatChips(containerId, kind, onChange) {
  const el = document.getElementById(containerId);
  const cats = Geo.nation[`${kind}_categories`] || [];
  el.innerHTML = `<button class="cat-chip active" data-cat="all">전체</button>`
    + cats.map(c => `<button class="cat-chip" data-cat="${c.id}">${c.emoji} ${c.label}</button>`).join('');

  el.addEventListener('click', e => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    el.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c === chip));
    onChange(chip.dataset.cat);
  });

  return {
    reset() {
      el.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    },
  };
}

// ── 국가 전환 (국가가 2개 이상일 때만 표시) ──
function initNationSwitch(containerId) {
  const el = document.getElementById(containerId);
  if (!el || Geo.nations.length < 2) return;
  el.classList.remove('hidden');
  el.innerHTML = Geo.nations.map(n => `
    <button class="nation-btn${n === Geo.nation ? ' active' : ''}" data-nation="${n.id}" title="${n.name}">${n.flag}</button>
  `).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.nation-btn');
    if (btn && btn.dataset.nation !== Geo.nation.id) setNation(btn.dataset.nation);
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
