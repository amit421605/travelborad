// Destinations: fetch JSON, search, filter and render cards
const App = (() => {
  const state = { all: [], query: '', tag: 'all', selected: '' };
  const $ = (id) => document.getElementById(id);
  const money = (n) => '\u20B9' + Math.round(n).toLocaleString('en-IN');

  const find = (id) => state.all.find((d) => d.id === id);

  async function load() {
    const list = $('destinationList');
    list.innerHTML = '<p class="text-muted">Loading destinations...</p>';
    try {
      const res = await fetch('data/destinations.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.all = await res.json();
    } catch (err) {
      list.innerHTML = `<div class="alert alert-warning">Could not load destinations (${err.message}).
        Open the project with the Live Server extension rather than double-clicking index.html.</div>`;
      return;
    }
    buildFilter();
    Trip.populateSelect(state.all);
    Trip.renderSaved();
    Trip.renderSummary();
    render();
  }

  function buildFilter() {
    const tags = [...new Set(state.all.map((d) => d.tag))].sort();
    $('tagFilter').innerHTML = '<option value="all">All types</option>' +
      tags.map((t) => `<option value="${t}">${t}</option>`).join('');
  }

  function matches(d) {
    const q = state.query.toLowerCase();
    const text = [d.name, d.region, d.tag, ...d.highlights].join(' ').toLowerCase();
    return (state.tag === 'all' || d.tag === state.tag) && text.includes(q);
  }

  function cardHtml(d) {
    const perDay = d.costs.stay + d.costs.food + d.costs.activities;
    return `
      <div class="col-md-6">
        <article class="dest-card ${d.id === state.selected ? 'selected' : ''}" data-tag="${d.tag}" data-id="${d.id}">
          <div class="d-flex justify-content-between align-items-start">
            <div><h3>${d.name}</h3><div class="dest-meta">${d.region}</div></div>
            <span class="dest-tag">${d.tag}</span>
          </div>
          <p class="dest-summary">${d.summary}</p>
          <ul class="dest-list">${d.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
          <div class="dest-meta mb-2">Best time: ${d.season}</div>
          <div class="dest-foot">
            <div class="dest-cost">${money(perDay)} <small>per person / day</small></div>
            <button class="btn btn-sm btn-brand" data-id="${d.id}">Plan this trip</button>
          </div>
        </article>
      </div>`;
  }

  function render() {
    const results = state.all.filter(matches);
    $('resultCount').textContent = `${results.length} of ${state.all.length} destinations`;
    $('destinationList').innerHTML = results.length
      ? results.map(cardHtml).join('')
      : '<p class="text-muted">No destinations match. Try a different word or reset the type filter.</p>';
  }

  function highlight(id) {
    state.selected = id;
    render();
  }

  $('searchBox').addEventListener('input', (e) => { state.query = e.target.value.trim(); render(); });
  $('tagFilter').addEventListener('change', (e) => { state.tag = e.target.value; render(); });
  $('destinationList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    highlight(btn.dataset.id);
    Trip.selectDestination(btn.dataset.id);
  });

  load();
  return { find, highlight };
})();
