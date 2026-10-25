'use strict';

let map, userMarker, currentLat, currentLng;
let currentRadius = 100;

async function init() {
  try { await loadGeo(); } catch (_) {}
  initLangSwitch('lang-switch');
  document.getElementById('wc-btn').addEventListener('click', locate);
}

document.addEventListener('DOMContentLoaded', init);

function locate() {
  const btn = document.getElementById('wc-btn');
  btn.disabled = true;
  btn.textContent = t('wc.locating');

  if (!navigator.geolocation) {
    showInfo(t('wc.no_geo'));
    btn.disabled = false;
    btn.textContent = t('wc.locate');
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
    1: 'wc.geo_denied',
    2: 'wc.geo_unavailable',
    3: 'wc.geo_timeout'
  };
  showInfo(t(msgs[err.code] || 'wc.geo_error'));
  const btn = document.getElementById('wc-btn');
  btn.disabled = false;
  btn.textContent = t('wc.retry');
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
  }).addTo(map).bindPopup(t('wc.me'));
}

async function fetchToilets(lat, lng, radius) {
  showInfo(t('wc.searching'));
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
      showInfo(t('wc.timeout'));
    } else {
      showInfo(t('wc.error'));
    }
  }
}

function renderResults(elements, userLat, userLng, radius) {
  const list = document.getElementById('wc-list');

  if (!elements || elements.length === 0) {
    if (radius === 100) {
      showInfo(t('wc.none_info', { radius }));
      list.innerHTML = `
        <div class="empty-msg">
          ${t('wc.none_near', { radius })}<br>
          <button class="wc-expand-btn" onclick="expandSearch()">${t('wc.expand', { radius: 300 })}</button>
        </div>`;
    } else {
      showInfo(t('wc.none_info', { radius }));
      list.innerHTML = `<div class="empty-msg">${t('wc.none_far')}</div>`;
    }
    return;
  }

  const items = elements.map(el => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    return { ...el, _lat: lat, _lng: lng, _dist: haversine(userLat, userLng, lat, lng) };
  }).sort((a, b) => a._dist - b._dist);

  showInfo(`${t('wc.found', { radius, count: items.length })} · <button class="wc-refresh-btn" onclick="reSearch()">${t('wc.refresh')}</button>`);

  items.forEach((item, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="wc-pin">${i + 1}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([item._lat, item._lng], { icon })
      .addTo(map)
      .bindPopup(`<strong>${item.tags?.name || t('wc.default_name')}</strong><br>${feeLabel(item.tags)} · ${Math.round(item._dist)}m`);
  });

  list.innerHTML = items.map((item, i) => buildCard(item, i + 1)).join('');
}

function buildCard(item, num) {
  const tags = item.tags || {};
  const name = tags.name || t('wc.default_name');
  const dist = Math.round(item._dist);
  const fee = feeLabel(tags);
  const access = accessLabel(tags);
  const hoursHtml = tags.opening_hours
    ? `<span class="wc-hours">⏰ ${tags.opening_hours}</span>` : '';
  const wcHtml = tags.wheelchair === 'yes'
    ? `<span class="wc-badge wc-badge-wc">${t('wc.wheelchair')}</span>` : '';
  const url = mapsUrl(`${item._lat},${item._lng}`);

  return `
    <div class="wc-card">
      <div class="wc-card-top">
        <div class="wc-num">${num}</div>
        <div class="wc-card-body">
          <div class="wc-name">${name}</div>
          <div class="wc-meta">
            <span class="wc-badge ${isPaid(tags) ? 'wc-badge-paid' : 'wc-badge-free'}">${fee}</span>
            <span class="wc-badge wc-badge-access">${access}</span>
            ${wcHtml}
          </div>
          ${hoursHtml}
        </div>
        <div class="wc-dist">${dist}m</div>
      </div>
      <a class="wc-maps-btn" href="${url}" target="_blank">${t('wc.view_map')}</a>
    </div>`;
}

function isPaid(tags) {
  return tags?.fee === 'yes';
}

function feeLabel(tags) {
  return isPaid(tags) ? t('wc.fee_paid') : t('wc.fee_free');
}

function accessLabel(tags) {
  const a = tags?.access;
  if (a === 'private') return t('wc.access_private');
  if (a === 'customers') return t('wc.access_customers');
  if (a === 'permissive') return t('wc.access_permissive');
  return t('wc.access_public');
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
