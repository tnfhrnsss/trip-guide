async function loadStore(id) {
  const stores = await loadData('stores.json', 'stores');
  return stores.find(s => s.id === id) || null;
}

function renderHeader(s) {
  const name = tx(s.name);
  document.title = `${name} - Trip Guide`;
  document.getElementById('hdr-name').textContent = name;
  document.getElementById('store-detail-name').textContent = name;
  // 간판 표기(현지어 이름)가 다르면 이름 아래에 표시
  const local = menuName(s.name);
  const localEl = document.getElementById('store-detail-local');
  localEl.textContent = local;
  localEl.classList.toggle('hidden', !local);
  document.getElementById('store-detail-desc').textContent = tx(s.description);
  document.getElementById('store-detail-address').innerHTML =
    `<a href="${mapsUrl(addressQuery(s.address))}" target="_blank" rel="noopener noreferrer">📍 ${tx(s.address)}</a>`;

  document.getElementById('store-detail-meta').innerHTML = `
    <span class="meta-tag">${catLabel('store', s.category)}</span>
    <span class="meta-tag">📍 ${placeName(s)}</span>
    ${s.tip_expected ? `<span class="meta-tag" title="${t('tag.tip_title')}">${t('tag.tip')}</span>` : ''}
    ${s.has_seating  ? `<span class="meta-tag" title="${t('tag.seating_title')}">🪑</span>` : ''}
  `;

}

function renderOrderGuide(guide) {
  const el = document.getElementById('order-guide');
  el.innerHTML = guide.map(step => `
    <div class="step-card">
      <div class="step-badge">${step.step}</div>
      <div class="step-title">${tx(step.title)}</div>
      ${step.note ? `<div class="step-tip">💡 ${tx(step.note)}</div>` : ''}
      <div class="step-options">
        ${step.options.map(opt => `
          <div class="step-option${opt.recommended ? ' recommended' : ''}">
            <div>
              <div class="opt-name">${tx(opt.name)}</div>
              ${menuName(opt.name) ? `<div class="opt-menu">${menuName(opt.name)}</div>` : ''}
            </div>
            ${opt.recommended ? '<span class="rec-star">✦</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderMenuGuide(guide) {
  const el = document.getElementById('menu-guide');
  el.innerHTML = guide.map(g => `
    <div class="menu-card">
      <div class="menu-top">
        <div>
          <div class="menu-name">${tx(g.name)}</div>
          ${menuName(g.name) ? `<div class="menu-name-sub">${menuName(g.name)}</div>` : ''}
        </div>
        ${g.recommended ? `<span class="menu-rec">${t('store.recommended')}</span>` : ''}
      </div>
      <div class="menu-desc">${tx(g.description)}</div>
    </div>
  `).join('');
}

function renderTips(tips) {
  const el = document.getElementById('tips-section');
  el.innerHTML = tips.map(tip => `<div class="tip-item">${tx(tip)}</div>`).join('');
}

function initTabs() {
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

async function init() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'index.html'; return; }

  await loadGeo();
  const store = await loadStore(id);
  if (!store) { location.href = 'index.html'; return; }

  renderHeader(store);
  if (store.order_guide?.length) renderOrderGuide(store.order_guide);
  if (store.menu_guide?.length)  renderMenuGuide(store.menu_guide);
  if (store.tips?.length)        renderTips(store.tips);
  initTabs();

  document.getElementById('back-btn').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
