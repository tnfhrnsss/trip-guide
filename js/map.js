let mapInstance = null;
let userMarker  = null;

function customIcon(cat) {
  const { color = '#2563EB', emoji } = catInfo('store', cat);
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:17px;line-height:1">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function addMarkers(stores) {
  stores.forEach(s => {
    if (!s.lat || !s.lng) return;
    L.marker([s.lat, s.lng], { icon: customIcon(s.category) })
      .bindPopup(`
        <div style="min-width:190px;font-family:-apple-system,sans-serif">
          <div style="font-weight:800;font-size:15px;margin-bottom:3px">${tx(s.name)}</div>
          <div style="font-size:12px;color:#718096;margin-bottom:7px">${catLabel('store', s.category)}</div>
          <div style="font-size:12px;margin-bottom:8px;line-height:1.4">${tx(s.description)}</div>
          <div style="display:flex;gap:8px;font-size:12px;color:#718096;margin-bottom:10px">
            ${s.tip_expected ? `<span>${t('tag.tip')}</span>` : ''}
            ${s.has_seating  ? '<span>🪑</span>' : ''}
          </div>
          <a href="store.html?nation=${Geo.nation.id}&id=${s.id}"
            style="display:block;background:#2563EB;color:#fff;padding:8px 12px;
            border-radius:8px;text-align:center;text-decoration:none;font-size:13px;font-weight:700">
            ${t('map.view_guide')}
          </a>
        </div>
      `)
      .addTo(mapInstance);
  });
}

function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    if (userMarker) mapInstance.removeLayer(userMarker);
    userMarker = L.circleMarker([lat, lng], {
      radius: 9,
      fillColor: '#2563EB',
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(mapInstance).bindPopup(t('map.here')).openPopup();
    mapInstance.setView([lat, lng], 15);
  }, () => {});
}

// 마지막으로 고른 지역 중심으로 연다 (중심 좌표가 없는 지역이면 첫 지역)
function initialView() {
  const { region } = loadSelection(Geo.regions);
  const r = region.center ? region : Geo.regions.find(x => x.center);
  return { center: r.center, zoom: r.zoom || 13 };
}

async function init() {
  await loadGeo();
  mapInstance = L.map('map', {
    ...initialView(),
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  try {
    addMarkers(await loadData('stores.json', 'stores'));
  } catch (_) {}

  document.getElementById('loc-btn').addEventListener('click', locateUser);
  locateUser();
}

document.addEventListener('DOMContentLoaded', init);
