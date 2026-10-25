async function loadStore(id) {
  const stores = await loadData('stores.json', 'stores');
  return stores.find(s => s.id === id) || null;
}

function renderHeader(s) {
  document.title = `${s.name} - Trip Guide`;
  document.getElementById('hdr-name').textContent = s.name;
  document.getElementById('store-detail-name').textContent = s.name;
  document.getElementById('store-detail-desc').textContent = s.description;
  document.getElementById('store-detail-address').innerHTML =
    `<a href="${mapsUrl(s.address)}" target="_blank" rel="noopener noreferrer">📍 ${s.address}</a>`;

  document.getElementById('store-detail-meta').innerHTML = `
    <span class="meta-tag">${catLabel('store', s.category)}</span>
    <span class="meta-tag">📍 ${placeName(s)}</span>
    ${s.tip_expected ? '<span class="meta-tag">🪙 Tip</span>' : ''}
    ${s.has_seating  ? '<span class="meta-tag">🪑</span>' : ''}
  `;

}

function renderOrdering(flow) {
  const el = document.getElementById('ordering-flow');
  el.innerHTML = flow.map(step => `
    <div class="step-card">
      <div class="step-badge">${step.step}</div>
      <div class="step-q-en">${step.question_en}</div>
      <div class="step-q-ko">${step.question_ko}</div>
      ${step.tip ? `<div class="step-tip">💡 ${step.tip}</div>` : ''}
      <div class="step-options">
        ${step.options.map(opt => `
          <div class="step-option${opt.recommended ? ' recommended' : ''}">
            <div>
              <div class="opt-en">${opt.en}</div>
              <div class="opt-ko">${opt.ko}</div>
            </div>
            ${opt.recommended ? '<span class="rec-star">✦</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderSauce(guide) {
  const el = document.getElementById('sauce-guide');
  el.innerHTML = guide.map(g => `
    <div class="sauce-card">
      <div class="sauce-top">
        <div>
          <div class="sauce-name">${g.name}</div>
          <div class="sauce-name-ko">${g.name_ko}</div>
        </div>
        ${g.recommended ? '<span class="sauce-rec">✦ 추천</span>' : ''}
      </div>
      <div class="sauce-desc">${g.description_ko}</div>
    </div>
  `).join('');
}

function renderTips(tips) {
  const el = document.getElementById('tips-section');
  el.innerHTML = tips.map(t => `<div class="tip-item">${t}</div>`).join('');
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
  if (store.ordering_flow?.length) renderOrdering(store.ordering_flow);
  if (store.sauce_guide?.length)   renderSauce(store.sauce_guide);
  if (store.tips?.length)          renderTips(store.tips);
  initTabs();

  document.getElementById('back-btn').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
