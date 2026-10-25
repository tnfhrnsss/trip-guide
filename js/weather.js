// WMO 날씨 코드 → i18n 키(wmo.*) + 아이콘
const WMO = {
  0:  { key: 'clear',         icon: '☀️' },
  1:  { key: 'mostly_clear',  icon: '🌤️' },
  2:  { key: 'partly_cloudy', icon: '⛅' },
  3:  { key: 'overcast',      icon: '🌥️' },
  45: { key: 'fog',           icon: '🌫️' },
  48: { key: 'dense_fog',     icon: '🌫️' },
  51: { key: 'drizzle',       icon: '🌦️' },
  53: { key: 'drizzle',       icon: '🌦️' },
  55: { key: 'drizzle',       icon: '🌦️' },
  61: { key: 'rain',          icon: '🌧️' },
  63: { key: 'rain',          icon: '🌧️' },
  65: { key: 'heavy_rain',    icon: '🌧️' },
  71: { key: 'snow',          icon: '🌨️' },
  73: { key: 'snow',          icon: '🌨️' },
  75: { key: 'heavy_snow',    icon: '❄️' },
  80: { key: 'showers',       icon: '🌦️' },
  81: { key: 'showers',       icon: '🌦️' },
  82: { key: 'heavy_showers', icon: '⛈️' },
  95: { key: 'thunder',       icon: '⛈️' },
  99: { key: 'thunder_hail',  icon: '⛈️' },
};

function wmoInfo(code) {
  const w = WMO[code] || { key: 'unknown', icon: '🌡️' };
  return { label: t(`wmo.${w.key}`), icon: w.icon };
}

async function fetchCityWeather(point) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lng}`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode`
    + `&timezone=${encodeURIComponent(point.timezone)}&forecast_days=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

function buildCards(point, data) {
  const days = [t('weather.today'), t('weather.tomorrow')];
  return [0, 1].map(i => {
    const info = wmoInfo(data.daily.weathercode[i]);
    const max  = Math.round(data.daily.temperature_2m_max[i]);
    const min  = Math.round(data.daily.temperature_2m_min[i]);
    const rain = data.daily.precipitation_probability_max[i] ?? 0;
    return `
      <div class="w-card">
        <div class="w-city">${point.name}</div>
        <div class="w-day">${days[i]}</div>
        <div class="w-temp">${info.icon} ${max}°</div>
        <div class="w-cond">${info.label}</div>
        <div class="w-hilo">${t('weather.hilo', { max, min })}</div>
        <div class="w-rain">${t('weather.rain', { rain })}</div>
      </div>`;
  }).join('');
}

// point: geo.js의 weatherPoint() 결과 { key, name, lat, lng, timezone }
async function initWeather(containerId, point) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!point) { el.innerHTML = ''; return; }

  const CACHE_KEY = `trip_weather_v1_${point.key}`;
  const TTL = 30 * 60 * 1000; // 30분

  // 캐시 유효하면 바로 렌더링
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < TTL) {
      el.innerHTML = buildCards(point, cached.data);
      return;
    }
  } catch (_) {}

  el.innerHTML = `<div class="w-loading">${t('weather.loading')}</div>`;

  // 실시간 fetch
  try {
    const data = await fetchCityWeather(point);
    el.innerHTML = buildCards(point, data);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {
    // 만료된 캐시라도 사용
    try {
      const stale = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (stale) {
        el.innerHTML = buildCards(point, stale.data);
        const banner = document.getElementById('offline-banner');
        if (banner) banner.classList.remove('hidden');
      } else {
        el.innerHTML = `<div class="w-loading">${t('weather.error')}</div>`;
      }
    } catch (_2) {
      el.innerHTML = `<div class="w-loading">${t('weather.error')}</div>`;
    }
  }
}
