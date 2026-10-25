'use strict';

let map, userMarker, currentLat, currentLng;
let currentRadius = 100;

document.getElementById('wc-btn').addEventListener('click', locate);
loadGeo().catch(() => {});

function locate() {
  const btn = document.getElementById('wc-btn');
  btn.disabled = true;
  btn.textContent = '위치 확인 중…';

  if (!navigator.geolocation) {
    showInfo('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    btn.disabled = false;
    btn.textContent = '📍 내 위치로 검색하기';
    return;
  }

  navigator.geolocation.getCurrentPosition(onPosition, onGeoError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  });
}

function onPosition(pos) {
  currentLat = pos.coords.latitude;
  currentLng = pos.coords.longitude;
  currentRadius = 100;

  document.getElementById('wc-initial').classList.add('hidden');
  initMap(currentLat, currentLng);
  fetchToilets(currentLat, currentLng, currentRadius);
}

function onGeoError(err) {
  const msgs = {
    1: '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.',
    2: '위치를 확인할 수 없습니다. GPS 신호를 확인해주세요.',
    3: '위치 확인 시간이 초과되었습니다. 다시 시도해주세요.'
  };
  showInfo(msgs[err.code] || '위치 확인 중 오류가 발생했습니다.');
  const btn = document.getElementById('wc-btn');
  btn.disabled = false;
  btn.textContent = '📍 다시 시도';
}

function initMap(lat, lng) {
  const mapEl = document.getElementById('wc-map');
  mapEl.classList.remove('hidden');

  if (map) {
    map.setView([lat, lng], 17);
    if (userMarker) userMarker.setLatLng([lat, lng]);
    return;
  }

  map = L.map('wc-map', { zoomControl: true }).setView([lat, lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);

  userMarker = L.circleMarker([lat, lng], {
    radius: 9,
    fillColor: '#2563EB',
    color: '#fff',
    weight: 2.5,
    fillOpacity: 1
  }).addTo(map).bindPopup('📍 내 위치');
}

async function fetchToilets(lat, lng, radius) {
  showInfo('화장실 검색 중…');
  document.getElementById('wc-list').innerHTML = '';

  // Remove previous toilet markers (keep user marker)
  if (map) {
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });
  }

  const query = `[out:json][timeout:15];(node["amenity"="toilets"](around:${radius},${lat},${lng});way["amenity"="toilets"](around:${radius},${lat},${lng}););out center tags;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    renderResults(data.elements, lat, lng, radius);
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      showInfo('검색 시간이 초과되었습니다. 다시 시도해주세요.');
    } else {
      showInfo('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }
}

function renderResults(elements, userLat, userLng, radius) {
  const list = document.getElementById('wc-list');

  if (!elements || elements.length === 0) {
    if (radius === 100) {
      showInfo(`반경 100m 내 화장실을 찾지 못했습니다.`);
      list.innerHTML = `
        <div class="empty-msg">
          반경 100m 내 등록된 화장실이 없습니다.<br>
          <button class="wc-expand-btn" onclick="expandSearch()">반경 300m로 다시 검색</button>
        </div>`;
    } else {
      showInfo(`반경 ${radius}m 내 화장실을 찾지 못했습니다.`);
      list.innerHTML = `<div class="empty-msg">주변에 등록된 화장실 정보가 없습니다.<br>조금 이동 후 다시 검색해보세요.</div>`;
    }
    return;
  }

  const items = elements.map(el => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    return { ...el, _lat: lat, _lng: lng, _dist: haversine(userLat, userLng, lat, lng) };
  }).sort((a, b) => a._dist - b._dist);

  const label = radius === 100 ? '100m' : `${radius}m`;
  showInfo(`반경 ${label} 내 화장실 ${items.length}곳 발견 · <button class="wc-refresh-btn" onclick="reSearch()">새로고침</button>`);

  items.forEach((item, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="wc-pin">${i + 1}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([item._lat, item._lng], { icon })
      .addTo(map)
      .bindPopup(`<strong>${item.tags?.name || '화장실'}</strong><br>${feeLabel(item.tags)} · ${Math.round(item._dist)}m`);
  });

  list.innerHTML = items.map((item, i) => buildCard(item, i + 1)).join('');
}

function buildCard(item, num) {
  const tags = item.tags || {};
  const name = tags.name || '공중화장실';
  const dist = Math.round(item._dist);
  const fee = feeLabel(tags);
  const access = accessLabel(tags);
  const hoursHtml = tags.opening_hours
    ? `<span class="wc-hours">⏰ ${tags.opening_hours}</span>` : '';
  const wcHtml = tags.wheelchair === 'yes'
    ? '<span class="wc-badge wc-badge-wc">♿ 휠체어</span>' : '';
  const url = mapsUrl(`${item._lat},${item._lng}`);

  return `
    <div class="wc-card">
      <div class="wc-card-top">
        <div class="wc-num">${num}</div>
        <div class="wc-card-body">
          <div class="wc-name">${name}</div>
          <div class="wc-meta">
            <span class="wc-badge ${fee === '무료' ? 'wc-badge-free' : 'wc-badge-paid'}">${fee}</span>
            <span class="wc-badge wc-badge-access">${access}</span>
            ${wcHtml}
          </div>
          ${hoursHtml}
        </div>
        <div class="wc-dist">${dist}m</div>
      </div>
      <a class="wc-maps-btn" href="${url}" target="_blank">지도에서 보기 →</a>
    </div>`;
}

function feeLabel(tags) {
  return tags?.fee === 'yes' ? '유료' : '무료';
}

function accessLabel(tags) {
  const a = tags?.access;
  if (a === 'private') return '비공개';
  if (a === 'customers') return '고객 전용';
  if (a === 'permissive') return '허용';
  return '공용';
}

function showInfo(html) {
  const info = document.getElementById('wc-info');
  info.classList.remove('hidden');
  info.innerHTML = html;
}

function expandSearch() {
  currentRadius = 300;
  fetchToilets(currentLat, currentLng, 300);
}

function reSearch() {
  fetchToilets(currentLat, currentLng, currentRadius);
}
