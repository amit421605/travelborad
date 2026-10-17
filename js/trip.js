// Trip form: validation, estimates, summary, localStorage
const Trip = (() => {
  const STORAGE_KEY = 'tripboard.trips';
  const expenseIds = ['expTransport', 'expStay', 'expFood', 'expActivities', 'expOther'];
  const $ = (id) => document.getElementById(id);
  const form = $('tripForm');
  const money = (n) => '\u20B9' + Math.round(n).toLocaleString('en-IN');
  const todayStr = () => new Date().toISOString().split('T')[0];

  /* ---------- storage ---------- */
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function setSaved(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  /* ---------- reading the form ---------- */
  function daysBetween(start, end) {
    if (!start || !end) return 0;
    const diff = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  }
  function readForm() {
    return {
      name: $('tripName').value.trim(),
      destinationId: $('destination').value,
      start: $('startDate').value,
      end: $('endDate').value,
      travelers: parseInt($('travelers').value, 10) || 0,
      budget: parseFloat($('budget').value) || 0,
      expenses: expenseIds.map((id) => parseFloat($(id).value) || 0)
    };
  }
  function fillForm(t) {
    $('tripName').value = t.name;
    $('destination').value = t.destinationId;
    $('startDate').value = t.start;
    $('endDate').value = t.end;
    $('travelers').value = t.travelers;
    $('budget').value = t.budget;
    expenseIds.forEach((id, i) => { $(id).value = t.expenses[i] || ''; });
    form.classList.remove('was-validated');
    renderSummary();
  }

  /* ---------- validation ---------- */
  function validate() {
    const start = $('startDate'), end = $('endDate');
    start.setCustomValidity(start.value && start.value < todayStr() ? 'past' : '');
    if (!end.value) {
      end.setCustomValidity('missing');
      $('endFeedback').textContent = 'Choose an end date.';
    } else if (start.value && end.value < start.value) {
      end.setCustomValidity('order');
      $('endFeedback').textContent = 'End date must be on or after the start date.';
    } else {
      end.setCustomValidity('');
    }
    return form.checkValidity();
  }

  /* ---------- estimate from destination data ---------- */
  function estimate() {
    const dest = App.find($('destination').value);
    const days = daysBetween($('startDate').value, $('endDate').value);
    const people = parseInt($('travelers').value, 10) || 1;
    if (!dest || !days) {
      toast('Pick a destination and both dates first.');
      return;
    }
    const c = dest.costs;
    const core = [c.transport * people, c.stay * days * people, c.food * days * people, c.activities * days * people];
    const other = Math.round(core.reduce((a, b) => a + b, 0) * 0.1);
    [...core, other].forEach((v, i) => { $(expenseIds[i]).value = Math.round(v); });
    renderSummary();
  }

  /* ---------- summary ---------- */
  function renderSummary() {
    const t = readForm();
    const dest = App.find(t.destinationId);
    const box = $('summary');
    ExpenseChart.update(t.expenses);

    if (!dest) {
      box.innerHTML = '<p class="empty-note">Choose a destination to see your trip summary.</p>';
      return;
    }
    const days = daysBetween(t.start, t.end);
    const total = t.expenses.reduce((a, b) => a + b, 0);
    const over = t.budget > 0 && total > t.budget;
    const pct = t.budget > 0 ? Math.min(100, (total / t.budget) * 100) : 0;
    const perPerson = t.travelers ? total / t.travelers : 0;
    const diff = Math.abs(t.budget - total);

    box.innerHTML = `
      <div class="summary-title">${escapeHtml(t.name || 'Untitled trip')}</div>
      <div class="summary-row"><span>Destination</span><span>${dest.name}, ${dest.region}</span></div>
      <div class="summary-row"><span>Dates</span><span>${t.start && t.end ? `${t.start} to ${t.end}` : 'Not set'}</span></div>
      <div class="summary-row"><span>Length</span><span>${days ? days + (days === 1 ? ' day' : ' days') : '-'}</span></div>
      <div class="summary-row"><span>Travelers</span><span>${t.travelers || '-'}</span></div>
      <div class="summary-row"><span>Planned total</span><span>${money(total)}</span></div>
      <div class="summary-row"><span>Per person</span><span>${money(perPerson)}</span></div>
      <div class="budget-bar ${over ? 'over' : ''}"><div style="width:${pct}%"></div></div>
      <div class="budget-note ${over ? 'over' : ''}">
        ${t.budget ? (over ? `${money(diff)} over budget` : `${money(diff)} left in budget`) : 'Add a budget to compare'}
      </div>`;
  }

  /* ---------- saved trips ---------- */
  function renderSaved() {
    const list = getSaved();
    const ul = $('savedList');
    if (!list.length) {
      ul.innerHTML = '<li class="empty-note">No saved trips yet. Fill in the form and save one.</li>';
      return;
    }
    ul.innerHTML = list.map((t) => {
      const d = App.find(t.destinationId);
      const total = t.expenses.reduce((a, b) => a + b, 0);
      return `<li class="saved-item">
        <div><strong>${escapeHtml(t.name)}</strong><small>${d ? d.name : 'Unknown'} &middot; ${money(total)}</small></div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" data-act="load" data-id="${t.id}">Open</button>
          <button class="btn btn-outline-secondary" data-act="delete" data-id="${t.id}">Delete</button>
        </div></li>`;
    }).join('');
  }

  function saveTrip() {
    const trip = { id: Date.now().toString(), ...readForm() };
    const list = getSaved();
    list.unshift(trip);
    setSaved(list);
    renderSaved();
    toast('Trip saved.');
  }

  /* ---------- helpers ---------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toast(msg) {
    $('toastBody').textContent = msg;
    bootstrap.Toast.getOrCreateInstance($('toast'), { delay: 2200 }).show();
  }
  function populateSelect(list) {
    $('destination').innerHTML = '<option value="">Choose a destination</option>' +
      list.map((d) => `<option value="${d.id}">${d.name} (${d.region})</option>`).join('');
  }
  function selectDestination(id) {
    $('destination').value = id;
    renderSummary();
    $('tripName').focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- events ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validate();
    form.classList.add('was-validated');
    if (ok) saveTrip();
  });
  form.addEventListener('input', () => {
    if (form.classList.contains('was-validated')) validate();
    renderSummary();
  });
  $('estimateBtn').addEventListener('click', estimate);
  $('resetBtn').addEventListener('click', () => {
    form.reset();
    form.classList.remove('was-validated');
    $('startDate').min = todayStr();
    renderSummary();
    App.highlight('');
  });
  $('savedList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const list = getSaved();
    if (btn.dataset.act === 'delete') {
      setSaved(list.filter((t) => t.id !== btn.dataset.id));
      renderSaved();
    } else {
      const trip = list.find((t) => t.id === btn.dataset.id);
      if (trip) { fillForm(trip); App.highlight(trip.destinationId); }
    }
  });
  $('destination').addEventListener('change', () => App.highlight($('destination').value));
  $('startDate').min = todayStr();

  return { populateSelect, selectDestination, renderSummary, renderSaved };
})();
