'use strict';

// 화면 다국어. geo.js의 loadGeo()가 가장 먼저 loadI18n()을 호출한다.
const LANGS = [
  { id: 'ko', label: 'KO' },
  { id: 'en', label: 'EN' },
  { id: 'ja', label: 'JA' },
];
const FALLBACK_LANG = 'en';
const I18n = { lang: FALLBACK_LANG, dict: {}, fallback: {} };

// 저장된 언어 > 브라우저 언어 > 영어
function detectLang() {
  let saved = null;
  try { saved = localStorage.getItem('trip_lang'); } catch (_) {}
  if (LANGS.some(l => l.id === saved)) return saved;
  const prefs = navigator.languages || [navigator.language || ''];
  for (const p of prefs) {
    const code = p.slice(0, 2).toLowerCase();
    if (LANGS.some(l => l.id === code)) return code;
  }
  return FALLBACK_LANG;
}

async function fetchDict(lang) {
  try {
    const res = await fetch(`i18n/${lang}.json`);
    return res.ok ? res.json() : {};
  } catch (_) { return {}; }
}

async function loadI18n() {
  I18n.lang = detectLang();
  [I18n.dict, I18n.fallback] = await Promise.all([
    fetchDict(I18n.lang),
    I18n.lang === FALLBACK_LANG ? {} : fetchDict(FALLBACK_LANG),
  ]);
  document.documentElement.lang = I18n.lang;
  applyI18n();
}

// t('wc.found', { radius: 100, count: 3 }) — {name} 자리를 채운다
function t(key, params) {
  const s = I18n.dict[key] ?? I18n.fallback[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
}

// 데이터 글자: 문자열은 그대로, { ko, en, ja } 객체는 현재 언어 > 영어 > 한국어 순
function tx(value) {
  if (value == null || typeof value !== 'object') return value ?? '';
  return value[I18n.lang] ?? value[FALLBACK_LANG] ?? value.ko ?? Object.values(value)[0] ?? '';
}

// data-i18n(글자), data-i18n-html(태그 포함), data-i18n-placeholder, data-i18n-title(title + aria-label)
function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
}

// 화면이 대부분 JS로 그려지므로 언어를 바꾸면 페이지를 다시 연다
function setLang(lang) {
  try { localStorage.setItem('trip_lang', lang); } catch (_) {}
  location.reload();
}

function initLangSwitch(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = LANGS.map(l => `
    <button class="lang-btn${l.id === I18n.lang ? ' active' : ''}" data-lang="${l.id}">${l.label}</button>
  `).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (btn && btn.dataset.lang !== I18n.lang) setLang(btn.dataset.lang);
  });
}
