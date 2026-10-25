const WMO = {
  0:  { ko: '맑음',       icon: '☀️' },
  1:  { ko: '대체로 맑음', icon: '🌤️' },
  2:  { ko: '구름 조금',   icon: '⛅' },
  3:  { ko: '흐림',       icon: '🌥️' },
  45: { ko: '안개',       icon: '🌫️' },
  48: { ko: '짙은 안개',  icon: '🌫️' },
  51: { ko: '이슬비',     icon: '🌦️' },
  53: { ko: '이슬비',     icon: '🌦️' },
  55: { ko: '이슬비',     icon: '🌦️' },
  61: { ko: '비',         icon: '🌧️' },
  63: { ko: '비',         icon: '🌧️' },
  65: { ko: '폭우',       icon: '🌧️' },
  71: { ko: '눈',         icon: '🌨️' },
  73: { ko: '눈',         icon: '🌨️' },
  75: { ko: '폭설',       icon: '❄️' },
  80: { ko: '소나기',     icon: '🌦️' },
  81: { ko: '소나기',     icon: '🌦️' },
  82: { ko: '강한 소나기', icon: '⛈️' },
  95: { ko: '뇌우',       icon: '⛈️' },
  99: { ko: '뇌우+우박',  icon: '⛈️' },
};

function wmoInfo(code) {
  return WMO[code] || { ko: '알 수 없음', icon: '🌡️' };
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
  const days = ['오늘', '내일'];
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
        <div class="w-cond">${info.ko}</div>
        <div class="w-hilo">최고 ${max}° / 최저 ${min}°</div>
        <div class="w-rain">💧 강수 ${rain}%</div>
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

  el.innerHTML = '<div class="w-loading">날씨 불러오는 중…</div>';

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
        el.innerHTML = '<div class="w-loading">날씨 정보를 불러올 수 없습니다.</div>';
      }
    } catch (_2) {
      el.innerHTML = '<div class="w-loading">날씨 정보를 불러올 수 없습니다.</div>';
    }
  }
}
