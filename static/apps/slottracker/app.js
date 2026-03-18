const VERSION = 'v0.0022';

// ── PocketBase client ────────────────────────────────────────────────────────

const PB = {
  get url()      { return localStorage.getItem('pb_url')      || 'https://crate.myqnapcloud.com:9090'; },
  set url(v)     { localStorage.setItem('pb_url', v.replace(/\/$/, '')); },
  get email()    { return localStorage.getItem('pb_email')    || 'slottracker@dgrpix.net'; },
  set email(v)   { localStorage.setItem('pb_email', v); },
  get password() { return localStorage.getItem('pb_password') || ''; },
  set password(v){ localStorage.setItem('pb_password', v); },

  _token: null,

  async authenticate() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(`${this.url}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: this.email, password: this.password }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error('Authentication failed — check email/password in Settings');
      const data = await r.json();
      this._token = data.token;
      return this._token;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  },

  async _authHeaders(json = false) {
    if (!this._token) await this.authenticate();
    const h = { 'Authorization': `Bearer ${this._token}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  },

  async _fetch(url, opts = {}, retried = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      if (r.status === 401 && !retried) {
        this._token = null;
        const token = await this.authenticate();
        const retryOpts = { ...opts, headers: { ...opts.headers, 'Authorization': `Bearer ${token}` } };
        return this._fetch(url, retryOpts, true);
      }
      return r;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  },

  async health() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const r = await fetch(`${this.url}/api/health`, { signal: controller.signal });
      clearTimeout(timer);
      return r.ok;
    } catch (e) {
      clearTimeout(timer);
      return false;
    }
  },

  async list(collection, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const headers = await this._authHeaders();
    const r = await this._fetch(
      `${this.url}/api/collections/${collection}/records${qs ? '?' + qs : ''}`,
      { headers }
    );
    if (!r.ok) throw new Error(`list ${collection} failed`);
    return r.json();
  },

  async get(collection, id) {
    const headers = await this._authHeaders();
    const r = await this._fetch(
      `${this.url}/api/collections/${collection}/records/${id}`,
      { headers }
    );
    if (!r.ok) throw new Error(`get ${collection}/${id} failed`);
    return r.json();
  },

  async create(collection, data) {
    const headers = await this._authHeaders(true);
    const r = await this._fetch(
      `${this.url}/api/collections/${collection}/records`,
      { method: 'POST', headers, body: JSON.stringify(data) }
    );
    if (!r.ok) throw new Error(`create ${collection} failed: ${await r.text()}`);
    return r.json();
  },

  async update(collection, id, data) {
    const headers = await this._authHeaders(true);
    const r = await this._fetch(
      `${this.url}/api/collections/${collection}/records/${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(data) }
    );
    if (!r.ok) throw new Error(`update ${collection}/${id} failed: ${await r.text()}`);
    return r.json();
  },

  async uploadFile(collection, id, fieldName, file) {
    const headers = await this._authHeaders(); // no Content-Type — browser sets multipart boundary
    const fd = new FormData();
    fd.append(fieldName, file, file.name);
    const r = await this._fetch(
      `${this.url}/api/collections/${collection}/records/${id}`,
      { method: 'PATCH', headers, body: fd }
    );
    if (!r.ok) throw new Error(`upload to ${collection}/${id} failed: ${await r.text()}`);
    return r.json();
  },

  fileUrl(collection, recordId, filename) {
    return `${this.url}/api/files/${collection}/${recordId}/${filename}`;
  },

  // Fetch a protected file and return a local blob URL usable in CSS/img src
  async fetchFileBlobUrl(collection, recordId, filename) {
    try {
      const headers = await this._authHeaders();
      const url = this.fileUrl(collection, recordId, filename);
      const r = await this._fetch(url, { headers });
      if (r.ok) return URL.createObjectURL(await r.blob());
    } catch (e) {
      console.warn('[PB] fetchFileBlobUrl failed:', e);
    }
    return null;
  },
};

// ── Image compression ────────────────────────────────────────────────────────

function compressImage(file, maxDim = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else                { width = Math.round(width * maxDim / height);  height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('canvas toBlob failed'));
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Router ───────────────────────────────────────────────────────────────────

const SCREENS = {
  home: {
    id: 'screen-home',
    title: 'SlotTracker',
    back: null,
    fab: true,
    fabOnClick: () => navigate('start-visit'),
    onEnter: showHome,
  },
  settings: {
    id: 'screen-settings',
    title: 'Settings',
    back: 'home',
    fab: false,
    onEnter: showSettings,
  },
};

let currentScreen = null;

function navigate(name, params = {}) {
  const def = SCREENS[name];
  if (!def) { console.warn('Unknown screen:', name); return; }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(def.id).classList.add('active');

  document.getElementById('page-title').textContent =
    typeof def.title === 'function' ? def.title(params) : def.title;

  const backBtn = document.getElementById('btn-back');
  if (def.back) {
    backBtn.classList.remove('hidden');
    backBtn.onclick = () => navigate(def.back);
  } else {
    backBtn.classList.add('hidden');
  }

  const fab = document.getElementById('fab');
  if (def.fab) {
    fab.classList.remove('hidden');
    fab.onclick = def.fabOnClick || null;
  } else {
    fab.classList.add('hidden');
  }

  currentScreen = name;
  if (def.onEnter) def.onEnter(params);
}

// ── Connection check ─────────────────────────────────────────────────────────

async function checkConnection(statusEl) {
  statusEl.className = 'conn-status checking';
  statusEl.textContent = 'Checking connection…';
  try {
    await PB.health();
  } catch {
    statusEl.className = 'conn-status error';
    statusEl.textContent = '● Cannot reach PocketBase — connect to VPN';
    return;
  }
  try {
    await PB.authenticate();
    statusEl.className = 'conn-status ok';
    statusEl.textContent = '● Connected & authenticated — ' + PB.url;
  } catch {
    statusEl.className = 'conn-status error';
    statusEl.textContent = '● Reached PocketBase but authentication failed — check credentials in Settings';
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDenom(d) {
  return d < 1 ? `${Math.round(d * 100)}¢` : `$${d}`;
}

function formatMoney(n) {
  return '$' + Number(n).toFixed(2);
}

// Detect cash insertions between consecutive sessions.
// sessions must be sorted by start_time.
// Returns { total, insertions: [{ amount, afterSessionIndex }], count }
function detectCashInsertions(sessions) {
  let total = 0;
  const insertions = [];
  for (let i = 0; i + 1 < sessions.length; i++) {
    const prev = sessions[i];
    const curr = sessions[i + 1];
    if (prev.end_balance == null) continue;
    const diff = curr.start_balance - prev.end_balance;
    if (diff < 1) continue; // < $1 treated as typo
    const amount = Math.round(diff);
    total += amount;
    insertions.push({ amount, afterSessionIndex: i });
  }
  return { total, insertions, count: insertions.length };
}

// Load the most recent photo for a casino and apply it as a screen background.
// Stores the fetched image in selectedVisitPhotoFile so it gets uploaded to the new visit.
async function preloadCasinoPhoto(casino) {
  try {
    const result = await PB.list('visits', {
      filter:  `casino = "${casino.replace(/"/g, '\\"')}" && visit_photo != ""`,
      sort:    '-created',
      perPage: 1,
      fields:  'id,visit_photo',
    });
    const visit = result.items?.[0];
    if (!visit?.visit_photo) return;

    const blobUrl = await PB.fetchFileBlobUrl('visits', visit.id, visit.visit_photo);
    if (!blobUrl) return;

    const screen = document.getElementById('screen-start-visit');
    screen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
    screen.style.backgroundSize     = 'cover';
    screen.style.backgroundPosition = 'center';
    screen.style.backgroundRepeat   = 'no-repeat';

    const placeholder = document.getElementById('sv-photo-placeholder');
    placeholder.textContent = '✓ Existing photo loaded';
    placeholder.style.color = 'var(--accent)';

    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    selectedVisitPhotoFile = new File([blob], visit.visit_photo, { type: blob.type || 'image/jpeg' });
  } catch (e) {
    console.warn('preloadCasinoPhoto failed:', e);
  }
}

// Load the most recent photo for a machine name and apply it to the new-session screen.
// Stores it in pendingPhotoFile so it gets uploaded to the new session.
async function preloadMachinePhoto(machine) {
  try {
    const result = await PB.list('sessions', {
      filter:  `machine_name = "${machine.replace(/"/g, '\\"')}" && machine_photo != ""`,
      sort:    '-created',
      perPage: 1,
      fields:  'id,machine_photo',
    });
    const session = result.items?.[0];
    if (!session?.machine_photo) return;

    const blobUrl = await PB.fetchFileBlobUrl('sessions', session.id, session.machine_photo);
    if (!blobUrl) return;

    const screen = document.getElementById('screen-new-session');
    screen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
    screen.style.backgroundSize     = 'cover';
    screen.style.backgroundPosition = 'center';
    screen.style.backgroundRepeat   = 'no-repeat';

    const placeholder = document.getElementById('photo-placeholder');
    placeholder.textContent = '✓ Existing photo loaded';
    placeholder.style.color = 'var(--accent)';

    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    pendingPhotoFile = new File([blob], session.machine_photo, { type: blob.type || 'image/jpeg' });
  } catch (e) {
    console.warn('preloadMachinePhoto failed:', e);
  }
}

// ── Home screen ──────────────────────────────────────────────────────────────

async function showHome() {
  const statusEl = document.getElementById('conn-status');
  if (!PB.password) {
    statusEl.className = 'conn-status error';
    statusEl.textContent = '● No credentials set — open Settings to configure';
    return;
  }
  checkConnection(statusEl);

  const listEl = document.getElementById('sessions-list');
  listEl.innerHTML = '<div class="empty-state" style="padding:40px 20px">Loading…</div>';

  try {
    const [visitsResult, sessionsResult] = await Promise.all([
      PB.list('visits', { sort: '-start_time', perPage: 200 }),
      PB.list('sessions', { sort: 'start_time', perPage: 500 }),
    ]);

    const visits      = visitsResult.items  || [];
    const allSessions = sessionsResult.items || [];

    // Group sessions by visit
    const sessionsByVisit  = {};
    const unassignedSessions = [];
    allSessions.forEach(s => {
      if (s.visit) {
        if (!sessionsByVisit[s.visit]) sessionsByVisit[s.visit] = [];
        sessionsByVisit[s.visit].push(s);
      } else {
        unassignedSessions.push(s);
      }
    });

    if (visits.length === 0 && unassignedSessions.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No visits yet.<br>Tap + to start your first visit.</div>';
      return;
    }

    let html = '';

    visits.forEach(v => {
      const sessions = (sessionsByVisit[v.id] || [])
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      html += renderVisitCard(v, sessions);
    });

    // Unassigned sessions (existing data without a visit)
    if (unassignedSessions.length > 0) {
      html += `<div class="section-label" style="margin:20px 0 8px">Unassigned Sessions</div>`;
      unassignedSessions
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
        .forEach(s => { html += renderSessionCard(s); });
    }

    listEl.innerHTML = html;

    listEl.querySelectorAll('.visit-card').forEach(card => {
      card.onclick = () => navigate('visit-detail', { visitId: card.dataset.id });
    });
    listEl.querySelectorAll('.session-card:not(.visit-card)').forEach(card => {
      card.onclick = () => navigate('session-detail', { sessionId: card.dataset.id });
    });

    // Lazy-load visit photos as backgrounds
    visits.forEach(v => {
      if (!v.visit_photo) return;
      const card = listEl.querySelector(`.visit-card[data-id="${v.id}"]`);
      if (!card) return;
      PB.fetchFileBlobUrl('visits', v.id, v.visit_photo).then(blobUrl => {
        if (!blobUrl || !card.isConnected) return;
        card.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url("${blobUrl}")`;
        card.style.backgroundSize     = 'cover';
        card.style.backgroundPosition = 'center';
      });
    });
  } catch (e) {
    listEl.innerHTML = '<div class="empty-state">Could not load data — check connection.</div>';
    console.error(e);
  }
}

function renderVisitCard(v, sessions) {
  const isOpen = !v.end_time;
  const { insertions, count: insertionCount } = detectCashInsertions(sessions);
  const cashAdded = insertions.reduce((sum, ins) => sum + ins.amount, 0);

  const startingCash   = sessions.length > 0 ? sessions[0].start_balance : null;
  const allEnded       = sessions.length > 0 && sessions.every(s => s.end_balance != null);
  const endingBalance  = allEnded ? sessions[sessions.length - 1].end_balance : null;
  const totalCashIn    = startingCash != null ? startingCash + cashAdded : null;
  const net            = (!isOpen && endingBalance != null && totalCashIn != null)
    ? endingBalance - totalCashIn : null;

  const date     = new Date(v.start_time);
  const dateStr  = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let durationStr = '';
  if (v.end_time) {
    const mins = Math.round((new Date(v.end_time) - new Date(v.start_time)) / 60000);
    durationStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  const netColor = n => n >= 0 ? 'var(--accent)' : 'var(--danger)';
  const netFmt   = n => (n >= 0 ? '+' : '') + formatMoney(n);

  let statusHtml;
  if (isOpen) {
    statusHtml = `<span style="color:var(--warning);font-weight:bold">In Progress</span>`;
  } else if (net !== null) {
    const cls = net > 0 ? 'win' : net < 0 ? 'loss' : 'push';
    statusHtml = `<span class="session-result ${cls}">${netFmt(net)}</span>`;
  } else {
    statusHtml = `<span style="color:var(--text-muted)">Ended</span>`;
  }

  let financialHtml = '';
  if (totalCashIn != null) {
    financialHtml = '<div class="visit-financial">';
    financialHtml += `<span class="visit-fin-item"><span class="visit-fin-label">Cash in</span>${formatMoney(totalCashIn)}</span>`;
    if (insertionCount > 0) {
      financialHtml += `<span class="visit-fin-item" style="color:var(--warning)"><span class="visit-fin-label">${insertionCount}x added</span>${formatMoney(cashAdded)}</span>`;
    }
    if (endingBalance != null && !isOpen) {
      financialHtml += `<span class="visit-fin-item"><span class="visit-fin-label">Ended at</span>${formatMoney(endingBalance)}</span>`;
    }
    financialHtml += '</div>';
  }

  return `
    <div class="session-card visit-card" data-id="${v.id}">
      <div class="session-card-top">
        <span class="session-machine">${v.casino}</span>
        ${statusHtml}
      </div>
      <div class="session-meta">
        <span>${dateStr}</span>
        ${durationStr ? `<span>${durationStr}</span>` : ''}
        <span>${sessions.length} session${sessions.length !== 1 ? 's' : ''}</span>
      </div>
      ${financialHtml}
    </div>`;
}

function renderSessionCard(s) {
  const hasResult   = s.end_balance != null;
  const net         = hasResult ? s.end_balance - s.start_balance : null;
  const resultClass = !hasResult ? '' : net > 0 ? 'win' : net < 0 ? 'loss' : 'push';
  const resultText  = !hasResult
    ? '<span style="color:var(--warning)">In Progress</span>'
    : `<span class="session-result ${resultClass}">${net >= 0 ? '+' : ''}${formatMoney(net)}</span>`;

  const date    = new Date(s.start_time);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let durationStr = '';
  if (s.end_time) {
    const mins = Math.round((new Date(s.end_time) - new Date(s.start_time)) / 60000);
    durationStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  return `
    <div class="session-card" data-id="${s.id}">
      <div class="session-card-top">
        <span class="session-machine">${s.machine_name}</span>
        ${resultText}
      </div>
      <div class="session-meta">
        <span>${s.casino}</span>
        <span>${dateStr}</span>
        ${durationStr ? `<span>${durationStr}</span>` : ''}
        <span>${formatDenom(s.denom)}</span>
      </div>
    </div>`;
}

// ── Settings screen ──────────────────────────────────────────────────────────

function showSettings() {
  document.getElementById('pb-url-input').value      = PB.url;
  document.getElementById('pb-email-input').value    = PB.email;
  document.getElementById('pb-password-input').value = PB.password;

  const statusEl = document.getElementById('settings-conn-status');

  document.getElementById('btn-test-conn').onclick = async () => {
    const url   = document.getElementById('pb-url-input').value.trim();
    const email = document.getElementById('pb-email-input').value.trim();
    const pass  = document.getElementById('pb-password-input').value;
    if (!url || !email || !pass) return;
    PB.url = url; PB.email = email; PB.password = pass;
    statusEl.classList.remove('hidden');
    await checkConnection(statusEl);
  };
}

// ── Start Visit ──────────────────────────────────────────────────────────────

SCREENS['start-visit'] = {
  id: 'screen-start-visit',
  title: 'New Visit',
  back: 'home',
  fab: false,
  onEnter: showStartVisit,
};

let selectedVisitPhotoFile = null;
let visitPhotoManual       = false;

async function showStartVisit() {
  selectedVisitPhotoFile = null;
  visitPhotoManual       = false;
  document.getElementById('sv-casino').value         = '';
  document.getElementById('sv-photo-input').value    = '';
  document.getElementById('sv-error').classList.add('hidden');
  const placeholder = document.getElementById('sv-photo-placeholder');
  placeholder.textContent = '📷 Tap to photograph casino';
  placeholder.style.color = '';
  document.getElementById('screen-start-visit').style.backgroundImage = '';

  // Populate casino datalist from past visits
  try {
    const result  = await PB.list('visits', { fields: 'casino', sort: '-created', perPage: 200 });
    const casinos = [...new Set(result.items.map(v => v.casino).filter(Boolean))].sort();
    document.getElementById('sv-casino-list').innerHTML = casinos.map(c => `<option value="${c}">`).join('');
  } catch { /* offline */ }

  const svScreen   = document.getElementById('screen-start-visit');
  const picker     = document.getElementById('sv-photo-picker');
  const photoInput = document.getElementById('sv-photo-input');

  picker.onclick = () => photoInput.click();
  photoInput.onchange = async () => {
    const file = photoInput.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    selectedVisitPhotoFile = compressed;
    visitPhotoManual = true;
    const blobUrl = URL.createObjectURL(compressed);
    svScreen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
    svScreen.style.backgroundSize     = 'cover';
    svScreen.style.backgroundPosition = 'center';
    svScreen.style.backgroundRepeat   = 'no-repeat';
    document.getElementById('sv-photo-placeholder').textContent = '✓ Photo attached';
    document.getElementById('sv-photo-placeholder').style.color = 'var(--accent)';
  };

  // Auto-load existing casino photo when a known casino is selected
  document.getElementById('sv-casino').onchange = () => {
    if (visitPhotoManual) return;
    const casino = document.getElementById('sv-casino').value.trim();
    if (casino) preloadCasinoPhoto(casino);
  };

  document.getElementById('btn-start-visit').onclick = startVisit;
}

async function startVisit() {
  const casino  = document.getElementById('sv-casino').value.trim();
  const errorEl = document.getElementById('sv-error');

  if (!casino) {
    errorEl.textContent = 'Casino name is required.';
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-start-visit');
  btn.disabled = true;
  btn.textContent = 'Starting…';
  errorEl.classList.add('hidden');

  try {
    const visit = await PB.create('visits', {
      casino,
      start_time: new Date().toISOString(),
    });

    if (selectedVisitPhotoFile) {
      try {
        await PB.uploadFile('visits', visit.id, 'visit_photo', selectedVisitPhotoFile);
      } catch (e) {
        console.warn('Visit photo upload failed:', e);
      }
    }

    navigate('visit-detail', { visitId: visit.id });
  } catch (e) {
    errorEl.textContent = 'Could not create visit — check connection.';
    errorEl.classList.remove('hidden');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Start Visit';
  }
}

// ── Visit Detail ─────────────────────────────────────────────────────────────

SCREENS['visit-detail'] = {
  id: 'screen-visit-detail',
  title: 'Visit',
  back: 'home',
  fab: true,
  fabOnClick: () => navigate('new-session', { visitId: currentVisit?.id }),
  onEnter: showVisitDetail,
};

let currentVisit     = null;
let endVisitLoading  = false;

function visitPanel(id) {
  ['vd-main', 'vd-end-confirm'].forEach(p => {
    const el = document.getElementById(p);
    if (id === p) el.classList.remove('hidden');
    else          el.classList.add('hidden');
  });
}

async function showVisitDetail({ visitId }) {
  endVisitLoading = false;

  // Clear stale state
  document.getElementById('vd-sessions-list').innerHTML =
    '<div class="empty-state" style="padding:30px 20px">Loading…</div>';
  document.getElementById('vd-main-error').classList.add('hidden');
  document.getElementById('vd-error').classList.add('hidden');
  visitPanel('vd-main');

  try {
    currentVisit = await PB.get('visits', visitId);
  } catch {
    alert('Could not load visit — check connection.');
    navigate('home');
    return;
  }

  document.getElementById('vd-casino').textContent  = currentVisit.casino;

  const startDate = new Date(currentVisit.start_time);
  const dateStr   = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr   = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yy  = String(startDate.getFullYear()).slice(2);
  const mm  = String(startDate.getMonth() + 1).padStart(2, '0');
  const dd  = String(startDate.getDate()).padStart(2, '0');
  const hh  = String(startDate.getHours()).padStart(2, '0');
  const min = String(startDate.getMinutes()).padStart(2, '0');
  document.getElementById('page-title').textContent = `${currentVisit.casino} · ${yy}/${mm}/${dd} ${hh}:${min}`;
  document.getElementById('vd-sub').textContent = `${dateStr} · started ${timeStr}`;

  // Background photo
  const screen = document.getElementById('screen-visit-detail');
  screen.style.backgroundImage = '';
  if (currentVisit.visit_photo) {
    PB.fetchFileBlobUrl('visits', currentVisit.id, currentVisit.visit_photo).then(blobUrl => {
      if (blobUrl) {
        screen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
        screen.style.backgroundSize     = 'cover';
        screen.style.backgroundPosition = 'center';
        screen.style.backgroundRepeat   = 'no-repeat';
      }
    });
  }

  // Load sessions
  try {
    const result   = await PB.list('sessions', {
      filter:  `visit='${visitId}'`,
      sort:    'start_time',
      perPage: 500,
    });
    const sessions = result.items || [];
    const listEl   = document.getElementById('vd-sessions-list');

    if (sessions.length === 0) {
      listEl.innerHTML = '<div class="empty-state" style="padding:30px 20px">No sessions yet.<br>Tap + to start a session.</div>';
    } else {
      listEl.innerHTML = sessions.map(s => {
        const hasResult   = s.end_balance != null;
        const net         = hasResult ? s.end_balance - s.start_balance : null;
        const resultClass = !hasResult ? '' : net > 0 ? 'win' : net < 0 ? 'loss' : 'push';
        const resultHtml  = !hasResult
          ? '<span style="color:var(--warning)">In Progress</span>'
          : `<span class="session-result ${resultClass}">${net >= 0 ? '+' : ''}${formatMoney(net)}</span>`;

        const tStr = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        let durStr = '';
        if (s.end_time) {
          const mins = Math.round((new Date(s.end_time) - new Date(s.start_time)) / 60000);
          durStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
        }

        return `
          <div class="session-card" data-id="${s.id}">
            <div class="session-card-top">
              <span class="session-machine">${s.machine_name}</span>
              ${resultHtml}
            </div>
            <div class="session-meta">
              <span>${tStr}</span>
              <span>${formatDenom(s.denom)}</span>
              ${durStr ? `<span>${durStr}</span>` : ''}
            </div>
          </div>`;
      }).join('');

      listEl.querySelectorAll('.session-card').forEach(card => {
        card.onclick = () => navigate('session-detail', { sessionId: card.dataset.id, visitId: currentVisit?.id });
      });
    }
  } catch (e) {
    document.getElementById('vd-sessions-list').innerHTML =
      '<div class="empty-state">Could not load sessions.</div>';
    console.error(e);
  }

  // End Visit button / ended status
  const endBtn      = document.getElementById('btn-end-visit');
  const endStatusEl = document.getElementById('vd-end-status');
  if (currentVisit.end_time) {
    const endT = new Date(currentVisit.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    endStatusEl.textContent = `Visit ended at ${endT}`;
    endStatusEl.classList.remove('hidden');
    endBtn.classList.add('hidden');
    document.getElementById('fab').classList.add('hidden'); // no new sessions on ended visit
  } else {
    endStatusEl.classList.add('hidden');
    endBtn.classList.remove('hidden');
    endBtn.onclick = showEndVisitConfirm;
  }
}

async function showEndVisitConfirm() {
  if (endVisitLoading) return;
  endVisitLoading = true;

  const errorEl = document.getElementById('vd-main-error');
  errorEl.classList.add('hidden');
  const endBtn = document.getElementById('btn-end-visit');
  endBtn.disabled    = true;
  endBtn.textContent = 'Loading…';

  try {
    const result   = await PB.list('sessions', {
      filter:  `visit='${currentVisit.id}'`,
      sort:    'start_time',
      perPage: 500,
    });
    const sessions = result.items || [];

    // Guard: all sessions must be ended
    const inProgress = sessions.filter(s => s.end_balance == null);
    if (inProgress.length > 0) {
      errorEl.textContent = `${inProgress.length} session${inProgress.length > 1 ? 's are' : ' is'} still in progress — end all sessions before ending the visit.`;
      errorEl.classList.remove('hidden');
      endBtn.disabled    = false;
      endBtn.textContent = 'End Visit';
      endVisitLoading    = false;
      return;
    }

    const { insertions } = detectCashInsertions(sessions);

    document.getElementById('vd-summary').innerHTML =
      buildVisitSummary(sessions, insertions);

    const confirmBtn = document.getElementById('btn-vd-confirm');
    confirmBtn.disabled    = false;
    confirmBtn.textContent = 'Confirm End Visit';
    confirmBtn.onclick     = confirmEndVisit;

    document.getElementById('btn-vd-cancel').onclick = () => visitPanel('vd-main');
    document.getElementById('vd-error').classList.add('hidden');

    visitPanel('vd-end-confirm');
  } catch (e) {
    errorEl.textContent = 'Could not load sessions — check connection.';
    errorEl.classList.remove('hidden');
    console.error(e);
  } finally {
    endBtn.disabled    = false;
    endBtn.textContent = 'End Visit';
    endVisitLoading    = false;
  }
}

function buildVisitSummary(sessions, insertions) {
  const cashAdded = insertions.reduce((sum, ins) => sum + ins.amount, 0);
  const netColor = n => n >= 0 ? 'var(--accent)' : 'var(--danger)';
  const netFmt   = n => (n >= 0 ? '+' : '') + formatMoney(n);

  const startingCash  = sessions.length > 0 ? sessions[0].start_balance : 0;
  const endingBalance = sessions.length > 0 ? sessions[sessions.length - 1].end_balance : 0;
  const totalCashIn   = startingCash + cashAdded;
  const net           = endingBalance - totalCashIn;

  let html = `
    <div class="sum-start">
      <span class="sum-label">Starting Cash</span>
      <span class="sum-amount">${formatMoney(startingCash)}</span>
    </div>`;

  sessions.forEach((s, i) => {
    const sNet    = s.end_balance != null ? s.end_balance - s.start_balance : null;
    const netHtml = sNet != null
      ? `<span style="color:${netColor(sNet)};font-weight:bold">${netFmt(sNet)}</span>`
      : '<span style="color:var(--warning)">in progress</span>';

    html += `
      <div class="sum-seg">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="sum-seg-num">Session ${i + 1} &middot; ${s.machine_name}</span>
          ${netHtml}
        </div>
      </div>`;

    const insertion = insertions.find(ins => ins.afterSessionIndex === i);
    if (insertion) {
      html += `
        <div class="sum-cash-insert">
          <span>&#128181; Cash added</span>
          <span style="font-weight:bold">+${formatMoney(insertion.amount)}</span>
        </div>`;
    }
  });

  html += `<div class="sum-net">`;
  if (cashAdded > 0) {
    html += `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span class="sum-label">Total Cash Added</span>
        <span style="color:var(--warning);font-weight:bold">+${formatMoney(cashAdded)}</span>
      </div>`;
  }
  html += `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span class="sum-label">Ending Balance</span>
        <span style="font-weight:bold">${formatMoney(endingBalance)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
        <span>Visit Net</span>
        <span style="color:${netColor(net)};font-weight:bold;font-size:18px">${netFmt(net)}</span>
      </div>
    </div>`;

  return html;
}

async function confirmEndVisit() {
  const errorEl    = document.getElementById('vd-error');
  const confirmBtn = document.getElementById('btn-vd-confirm');
  confirmBtn.disabled    = true;
  confirmBtn.textContent = 'Saving…';
  errorEl.classList.add('hidden');

  try {
    await PB.update('visits', currentVisit.id, {
      end_time: new Date().toISOString(),
    });
    navigate('home');
  } catch (e) {
    errorEl.textContent = 'Save failed — check connection.';
    errorEl.classList.remove('hidden');
    confirmBtn.disabled    = false;
    confirmBtn.textContent = 'Confirm End Visit';
    console.error(e);
  }
}

// ── New Session ──────────────────────────────────────────────────────────────

SCREENS['new-session'] = {
  id: 'screen-new-session',
  title: 'New Session',
  back: 'home', // overridden in showNewSession when visitId is set
  fab: false,
  onEnter: showNewSession,
};

let selectedDenom        = null;
let pendingPhotoFile     = null;
let newSessionVisitId    = null;
let sessionPhotoManual   = false;

async function showNewSession({ visitId } = {}) {
  newSessionVisitId = visitId || null;

  // Override back button to return to visit-detail when coming from a visit
  if (visitId) {
    const backBtn = document.getElementById('btn-back');
    backBtn.classList.remove('hidden');
    backBtn.onclick = () => navigate('visit-detail', { visitId });
  }

  // Reset form
  selectedDenom      = null;
  pendingPhotoFile   = null;
  sessionPhotoManual = false;
  document.getElementById('ns-casino').value        = '';
  document.getElementById('ns-machine').value       = '';
  document.getElementById('ns-bet').value           = '';
  document.getElementById('ns-start-balance').value = '';
  document.getElementById('photo-input').value      = '';
  const placeholder = document.getElementById('photo-placeholder');
  placeholder.textContent = '📷 Tap to photograph machine';
  placeholder.style.color = '';
  document.getElementById('screen-new-session').style.backgroundImage = '';
  const preview = document.getElementById('photo-preview');
  preview.classList.add('hidden');
  preview.src = '';
  document.querySelectorAll('#denom-buttons .pill').forEach(p => p.classList.remove('selected'));
  setFormError('');

  // Pre-fill casino from current visit
  if (visitId && currentVisit && currentVisit.id === visitId) {
    document.getElementById('ns-casino').value = currentVisit.casino;
  }

  // Populate datalists from past sessions
  try {
    const result   = await PB.list('sessions', { fields: 'casino,machine_name', sort: '-created', perPage: 500 });
    const casinos  = [...new Set(result.items.map(s => s.casino).filter(Boolean))].sort();
    const machines = [...new Set(result.items.map(s => s.machine_name).filter(Boolean))].sort();
    document.getElementById('casino-list').innerHTML  = casinos.map(c  => `<option value="${c}">`).join('');
    document.getElementById('machine-list').innerHTML = machines.map(m => `<option value="${m}">`).join('');
  } catch { /* offline */ }

  // Photo picker
  const nsScreen   = document.getElementById('screen-new-session');
  const picker     = document.getElementById('photo-picker');
  const photoInput = document.getElementById('photo-input');
  nsScreen.style.backgroundImage = '';

  picker.onclick = () => photoInput.click();
  photoInput.onchange = async () => {
    const file = photoInput.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    pendingPhotoFile   = compressed;
    sessionPhotoManual = true;
    const blobUrl = URL.createObjectURL(compressed);
    nsScreen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
    nsScreen.style.backgroundSize     = 'cover';
    nsScreen.style.backgroundPosition = 'center';
    nsScreen.style.backgroundRepeat   = 'no-repeat';
    document.getElementById('photo-placeholder').textContent = '✓ Photo attached';
    document.getElementById('photo-placeholder').style.color = 'var(--accent)';
  };

  // Auto-load existing machine photo when a known machine is selected
  document.getElementById('ns-machine').onchange = () => {
    if (sessionPhotoManual) return;
    const machine = document.getElementById('ns-machine').value.trim();
    if (machine) preloadMachinePhoto(machine);
  };

  // Denomination pills
  document.querySelectorAll('#denom-buttons .pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#denom-buttons .pill').forEach(p => p.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDenom = parseFloat(btn.dataset.value);
    };
  });

  document.getElementById('btn-start-session').onclick = startSession;
}

function setFormError(msg) {
  const el = document.getElementById('ns-error');
  if (msg) { el.textContent = msg; el.classList.remove('hidden'); }
  else      { el.classList.add('hidden'); }
}

async function startSession() {
  const casino   = document.getElementById('ns-casino').value.trim();
  const machine  = document.getElementById('ns-machine').value.trim();
  const bet      = parseFloat(document.getElementById('ns-bet').value);
  const startBal = parseFloat(document.getElementById('ns-start-balance').value);

  if (!casino)              return setFormError('Casino name is required.');
  if (!machine)             return setFormError('Machine name is required.');
  if (!selectedDenom)       return setFormError('Select a denomination.');
  if (!bet || bet <= 0)     return setFormError('Enter a valid bet per spin.');
  if (!startBal || startBal <= 0) return setFormError('Enter a valid starting balance.');

  const btn = document.getElementById('btn-start-session');
  btn.disabled    = true;
  btn.textContent = 'Starting…';
  setFormError('');

  try {
    const sessionData = {
      casino,
      machine_name:  machine,
      denom:         selectedDenom,
      bet_per_spin:  bet,
      start_balance: startBal,
      start_time:    new Date().toISOString(),
    };
    if (newSessionVisitId) sessionData.visit = newSessionVisitId;

    const session = await PB.create('sessions', sessionData);

    if (pendingPhotoFile) {
      try {
        await PB.uploadFile('sessions', session.id, 'machine_photo', pendingPhotoFile);
      } catch (e) {
        console.warn('Photo upload failed:', e);
      }
    }

    navigate('active-session', { sessionId: session.id, visitId: newSessionVisitId });
  } catch (e) {
    setFormError('Could not save session — check connection.');
    console.error(e);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Start Session';
  }
}

// ── Active Session ────────────────────────────────────────────────────────────

SCREENS['active-session'] = {
  id: 'screen-active-session',
  title: 'Session',
  back: null,   // no back button — must use End Session
  fab: false,
  onEnter: showActiveSession,
};

let currentSession        = null;
let currentSessionVisitId = null;
let sessionTimerInterval  = null;
let completedBonusSpins   = 0;
let bonusCount            = 0;
let segmentStartBalance   = 0;
let bonusStartBalance     = null;
let bonusStartTime        = null;
let bonusSegmentSpins     = 0;

// ── Panel switcher ────────────────────────────────────────────────────────────

function showPanel(id) {
  ['as-main-content', 'as-bonus-inprogress', 'as-bonus-form', 'as-end-confirm']
    .forEach(p => document.getElementById(p).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function updateTimers() {
  if (!currentSession) return;
  const elapsed = Math.floor((Date.now() - new Date(currentSession.start_time)) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const str = `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  document.getElementById('as-timer').textContent     = str;
  document.getElementById('as-timer-bip').textContent = str;
  document.getElementById('as-timer-bf').textContent  = str;
  document.getElementById('as-timer-ec').textContent  = str;
}

// ── Show active session ───────────────────────────────────────────────────────

async function showActiveSession({ sessionId, visitId }) {
  clearInterval(sessionTimerInterval);
  currentSession        = null;
  currentSessionVisitId = visitId || null;
  completedBonusSpins   = 0;
  bonusCount            = 0;
  segmentStartBalance   = 0;
  bonusStartBalance     = null;
  bonusStartTime        = null;
  bonusSegmentSpins     = 0;
  endConfirmLoading     = false;

  try {
    currentSession = await PB.get('sessions', sessionId);
  } catch {
    alert('Could not load session — check connection.');
    if (visitId) navigate('visit-detail', { visitId });
    else         navigate('home');
    return;
  }

  document.getElementById('page-title').textContent = currentSession.machine_name;
  document.getElementById('as-machine').textContent = currentSession.machine_name;
  document.getElementById('as-sub').textContent =
    `${currentSession.casino} · ${formatDenom(currentSession.denom)} · $${currentSession.bet_per_spin}/spin`;

  document.getElementById('as-start-balance-display').textContent = formatMoney(currentSession.start_balance);
  document.getElementById('as-denom-display').textContent = formatDenom(currentSession.denom);
  document.getElementById('as-bet-display').textContent   = formatMoney(currentSession.bet_per_spin);
  document.getElementById('as-balance').value = '';
  document.getElementById('as-spins').value   = '';
  segmentStartBalance = currentSession.start_balance;

  // Background photo
  const screen = document.getElementById('screen-active-session');
  screen.style.backgroundImage = '';
  if (currentSession.machine_photo) {
    PB.fetchFileBlobUrl('sessions', currentSession.id, currentSession.machine_photo).then(blobUrl => {
      if (blobUrl) {
        screen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
        screen.style.backgroundSize     = 'cover';
        screen.style.backgroundPosition = 'center';
        screen.style.backgroundRepeat   = 'no-repeat';
      }
    });
  }

  // Load any existing bonuses (handles refresh mid-session)
  try {
    const result  = await PB.list('bonuses', {
      filter:  `session='${sessionId}'`,
      sort:    'bonus_time',
      perPage: 500,
    });
    const bonuses = result.items || [];
    bonusCount = bonuses.length;
    bonuses.forEach(b => { if (b.end_balance != null) completedBonusSpins += (b.spins || 0); });
  } catch { /* offline; start fresh */ }

  updateActiveSessionDisplay();

  sessionTimerInterval = setInterval(updateTimers, 1000);
  updateTimers();

  document.getElementById('btn-bonus').onclick       = startBonus;
  document.getElementById('btn-end-session').onclick = showEndConfirm;
  document.getElementById('as-spins').oninput        = updateActionButtons;
  document.getElementById('as-balance').oninput      = updateActionButtons;
  updateActionButtons();

  showPanel('as-main-content');
}

function updateActiveSessionDisplay() {
  document.getElementById('as-bonus-count').textContent = bonusCount;
  document.getElementById('as-segment-num').textContent = bonusCount + 1;
  document.getElementById('as-total-spins').textContent = completedBonusSpins;
}

function updateActionButtons() {
  if (!currentSession) return;
  const hasSpins   = document.getElementById('as-spins').value.trim() !== '';
  const hasBalance = document.getElementById('as-balance').value.trim() !== '';
  const bonusBtn   = document.getElementById('btn-bonus');
  const endBtn     = document.getElementById('btn-end-session');
  const warnEl     = document.getElementById('as-balance-warning');

  const spins      = parseInt(document.getElementById('as-spins').value) || 0;
  const balance    = parseFloat(document.getElementById('as-balance').value);
  const minPossible = segmentStartBalance - (spins * currentSession.bet_per_spin);

  if (hasBalance && spins > 0 && balance < minPossible - 0.01) {
    warnEl.textContent = `Balance seems too low — minimum possible after ${spins} spins at $${currentSession.bet_per_spin}/spin is ${formatMoney(minPossible)}.`;
    warnEl.classList.remove('hidden');
  } else {
    warnEl.classList.add('hidden');
  }

  const bonusBlocked     = !hasSpins || !hasBalance;
  bonusBtn.disabled      = bonusBlocked;
  bonusBtn.style.opacity = bonusBlocked ? '0.4' : '';

  endBtn.disabled      = !hasBalance;
  endBtn.style.opacity = hasBalance ? '' : '0.4';
}

// ── Bonus: start ──────────────────────────────────────────────────────────────

function startBonus() {
  bonusStartBalance = parseFloat(document.getElementById('as-balance').value);
  bonusStartTime    = new Date();
  bonusSegmentSpins = parseInt(document.getElementById('as-spins').value) || 0;

  completedBonusSpins += bonusSegmentSpins;
  bonusCount++;

  document.getElementById('as-bip-machine').textContent   = currentSession.machine_name;
  document.getElementById('as-bip-start-bal').textContent = formatMoney(bonusStartBalance);
  document.getElementById('as-spins').value = '';

  updateActiveSessionDisplay();

  document.getElementById('btn-bonus-done').onclick   = showBonusForm;
  document.getElementById('btn-bonus-cancel').onclick = cancelBonus;

  showPanel('as-bonus-inprogress');
}

// ── Bonus: cancel ─────────────────────────────────────────────────────────────

function cancelBonus() {
  bonusCount--;
  completedBonusSpins -= bonusSegmentSpins;
  document.getElementById('as-spins').value = bonusSegmentSpins > 0 ? bonusSegmentSpins : '';
  bonusStartBalance = null;
  bonusStartTime    = null;

  updateActiveSessionDisplay();
  showPanel('as-main-content');
  updateActionButtons();
}

// ── Bonus: show form ──────────────────────────────────────────────────────────

function showBonusForm() {
  document.getElementById('as-bf-machine').textContent   = currentSession.machine_name;
  document.getElementById('as-bf-start-bal').textContent = formatMoney(bonusStartBalance);

  document.querySelectorAll('input[name="bonus-type"]').forEach(r => { r.checked = false; });

  document.getElementById('bc-end-balance').value = '';
  document.getElementById('bc-video-url').value = '';
  document.getElementById('bc-error').classList.add('hidden');

  document.getElementById('btn-paste-video-url').onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) document.getElementById('bc-video-url').value = text.trim();
    } catch (e) {}
  };

  document.getElementById('btn-bc-save').onclick = saveBonus;
  document.getElementById('btn-bc-back').onclick = () => showPanel('as-bonus-inprogress');

  showPanel('as-bonus-form');
}

// ── Bonus: save ───────────────────────────────────────────────────────────────

async function saveBonus() {
  const typeInput = document.querySelector('input[name="bonus-type"]:checked');
  const endBal    = parseFloat(document.getElementById('bc-end-balance').value);
  const errorEl   = document.getElementById('bc-error');

  if (!typeInput) {
    errorEl.textContent = 'Select a bonus type.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (isNaN(endBal)) {
    errorEl.textContent = 'Enter balance after bonus.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (endBal < bonusStartBalance - 0.01) {
    errorEl.textContent = `Balance after bonus can't be less than the starting balance (${formatMoney(bonusStartBalance)}) — bonuses can't lose money.`;
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-bc-save');
  btn.disabled    = true;
  btn.textContent = 'Saving…';
  errorEl.classList.add('hidden');

  try {
    const videoUrl = document.getElementById('bc-video-url').value.trim();
    const bonus = await PB.create('bonuses', {
      session:         currentSession.id,
      spins:           bonusSegmentSpins,
      bonus_type:      typeInput.value,
      start_balance:   bonusStartBalance,
      end_balance:     endBal,
      bonus_time:      bonusStartTime.toISOString(),
      bonus_video_url: videoUrl || null,
    });

    document.getElementById('as-balance').value = endBal;
    segmentStartBalance = endBal;
    bonusStartBalance   = null;
    bonusStartTime      = null;

    showPanel('as-main-content');
    updateActionButtons();
  } catch (e) {
    errorEl.textContent = 'Save failed — check connection.';
    errorEl.classList.remove('hidden');
    console.error(e);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Complete Bonus';
  }
}

// ── End Session: show confirm ─────────────────────────────────────────────────

let endConfirmLoading = false;

async function showEndConfirm() {
  if (endConfirmLoading) return;
  endConfirmLoading = true;
  const endBal         = parseFloat(document.getElementById('as-balance').value);
  const remainingSpins = parseInt(document.getElementById('as-spins').value) || 0;

  document.getElementById('as-ec-machine').textContent = currentSession.machine_name;
  document.getElementById('ec-final-bal').textContent  = formatMoney(endBal);
  document.getElementById('ec-error').classList.add('hidden');

  const summaryEl = document.getElementById('ec-summary');
  summaryEl.innerHTML = '';
  try {
    const result  = await PB.list('bonuses', {
      filter:  `session='${currentSession.id}'`,
      sort:    'bonus_time',
      perPage: 500,
    });
    const bonuses    = result.items || [];
    const typeLabel  = { free_games: 'Free Games', hold_and_spin: 'Hold & Spin', other: 'Other' };
    const sessionNet = endBal - currentSession.start_balance;
    const netColor   = n => n >= 0 ? 'var(--accent)' : 'var(--danger)';
    const netFmt     = n => (n >= 0 ? '+' : '') + formatMoney(n);

    summaryEl.innerHTML = `
      <div class="sum-start">
        <span class="sum-label">Started</span>
        <span class="sum-amount">${formatMoney(currentSession.start_balance)}</span>
      </div>`;

    bonuses.forEach((b, i) => {
      const bonusWin   = b.end_balance != null ? b.end_balance - b.start_balance : null;
      const runningNet = b.end_balance != null ? b.end_balance - currentSession.start_balance : null;
      const multiplier = bonusWin != null && bonusWin > 0 && currentSession.bet_per_spin > 0
        ? Math.round(bonusWin / currentSession.bet_per_spin) : null;

      const winColor  = bonusWin   != null ? netColor(bonusWin)   : 'var(--text-muted)';
      const sessColor = runningNet != null ? netColor(runningNet) : 'var(--text-muted)';
      const winStr    = bonusWin   != null ? netFmt(bonusWin)     : 'in progress';
      const multStr   = multiplier ? `<small>(${multiplier}x)</small> ` : '';

      summaryEl.innerHTML += `
        <div class="sum-seg">
          <div class="sum-seg-header">
            <span class="sum-seg-num">Seg ${i + 1} &middot; ${b.spins || 0} spins</span>
            <span class="sum-seg-type">${typeLabel[b.bonus_type] || b.bonus_type}</span>
          </div>
          <div class="sum-bonus-win" style="color:${winColor}">${multStr}${winStr}</div>
          ${runningNet != null ? `<div class="sum-seg-running" style="color:${sessColor}">session ${netFmt(runningNet)}</div>` : ''}
        </div>`;
    });

    const lastBal  = bonuses.length > 0 && bonuses[bonuses.length - 1].end_balance != null
      ? bonuses[bonuses.length - 1].end_balance
      : currentSession.start_balance;
    const finalNet = endBal - lastBal;
    summaryEl.innerHTML += `
      <div class="sum-seg">
        <div class="sum-seg-header">
          <span class="sum-seg-num">Seg ${bonuses.length + 1} &middot; ${remainingSpins} spins</span>
          <span class="sum-seg-type" style="color:var(--text-muted)">no bonus</span>
        </div>
        <div class="sum-seg-flow">
          <span class="sum-seg-from">${formatMoney(lastBal)}</span>
          <span class="sum-arrow">&#8594;</span>
          <span class="sum-seg-to">${formatMoney(endBal)}</span>
          <span class="sum-seg-net" style="color:${netColor(finalNet)}">${netFmt(finalNet)}</span>
        </div>
      </div>`;

    summaryEl.innerHTML += `
      <div class="sum-net">
        <span>Session net</span>
        <span style="color:${netColor(sessionNet)};font-weight:bold;font-size:18px">${netFmt(sessionNet)}</span>
      </div>`;
  } catch {
    summaryEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Could not load segment data</div>';
  }

  const confirmBtn = document.getElementById('btn-ec-confirm');
  confirmBtn.disabled    = false;
  confirmBtn.textContent = 'Confirm End Session';
  confirmBtn.onclick     = () => saveEndSession(endBal);
  document.getElementById('btn-ec-cancel').onclick = () => showPanel('as-main-content');

  endConfirmLoading = false;
  showPanel('as-end-confirm');
}

// ── End Session: save ─────────────────────────────────────────────────────────

async function saveEndSession(endBal) {
  const errorEl = document.getElementById('ec-error');
  const btn     = document.getElementById('btn-ec-confirm');
  btn.disabled    = true;
  btn.textContent = 'Saving…';
  errorEl.classList.add('hidden');

  try {
    await PB.update('sessions', currentSession.id, {
      end_balance: endBal,
      end_time:    new Date().toISOString(),
    });
    clearInterval(sessionTimerInterval);
    if (currentSessionVisitId) {
      navigate('visit-detail', { visitId: currentSessionVisitId });
    } else {
      navigate('home');
    }
  } catch (e) {
    errorEl.textContent = 'Save failed — check connection.';
    errorEl.classList.remove('hidden');
    console.error(e);
    btn.disabled    = false;
    btn.textContent = 'Confirm End Session';
  }
}

// ── Session Detail ────────────────────────────────────────────────────────────

SCREENS['session-detail'] = {
  id: 'screen-session-detail',
  title: 'Session',
  back: null, // set dynamically based on where we came from
  fab: false,
  onEnter: showSessionDetail,
};

async function showSessionDetail({ sessionId, visitId }) {
  const screen = document.getElementById('screen-session-detail');
  screen.style.backgroundImage = '';
  screen.innerHTML = '<div class="empty-state" style="padding:40px 20px">Loading…</div>';

  // Back button: visit-detail or home
  const backBtn = document.getElementById('btn-back');
  backBtn.classList.remove('hidden');
  backBtn.onclick = visitId
    ? () => navigate('visit-detail', { visitId })
    : () => navigate('home');

  let session, bonuses;
  try {
    [session, bonuses] = await Promise.all([
      PB.get('sessions', sessionId),
      PB.list('bonuses', { filter: `session='${sessionId}'`, sort: 'bonus_time', perPage: 500 })
        .then(r => r.items || []),
    ]);
  } catch (e) {
    screen.innerHTML = '<div class="empty-state">Could not load session — check connection.</div>';
    console.error(e);
    return;
  }

  document.getElementById('page-title').textContent = session.machine_name;

  // Background photo
  if (session.machine_photo) {
    PB.fetchFileBlobUrl('sessions', session.id, session.machine_photo).then(blobUrl => {
      if (blobUrl) {
        screen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
        screen.style.backgroundSize     = 'cover';
        screen.style.backgroundPosition = 'center';
        screen.style.backgroundRepeat   = 'no-repeat';
      }
    });
  }

  const hasResult = session.end_balance != null;
  const net       = hasResult ? session.end_balance - session.start_balance : null;
  const netColor  = n => n >= 0 ? 'var(--accent)' : 'var(--danger)';
  const netFmt    = n => (n >= 0 ? '+' : '') + formatMoney(n);
  const typeLabel = { free_games: 'Free Games', hold_and_spin: 'Hold & Spin', other: 'Other' };

  const startDate  = new Date(session.start_time);
  const dateStr    = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr    = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  let durationStr = '';
  if (session.end_time) {
    const mins = Math.round((new Date(session.end_time) - startDate) / 60000);
    durationStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  const totalSpins = bonuses.reduce((sum, b) => sum + (b.spins || 0), 0);

  let html = `
    <div class="session-info-bar">
      <div class="as-machine">${session.machine_name}</div>
      <div class="as-sub">${session.casino} &middot; ${formatDenom(session.denom)} &middot; ${formatMoney(session.bet_per_spin)}/spin</div>
    </div>

    <div class="session-stat-row" style="margin-bottom:14px">
      <div class="session-stat">
        <div class="stat-label">Start</div>
        <div class="session-stat-val" style="color:var(--text)">${formatMoney(session.start_balance)}</div>
      </div>
      <div class="session-stat">
        <div class="stat-label">End</div>
        <div class="session-stat-val" style="color:var(--text)">${hasResult ? formatMoney(session.end_balance) : '—'}</div>
      </div>
      <div class="session-stat">
        <div class="stat-label">Net</div>
        <div class="session-stat-val" style="color:${net != null ? netColor(net) : 'var(--text-muted)'}">${net != null ? netFmt(net) : '—'}</div>
      </div>
    </div>

    <div class="session-meta" style="margin-bottom:18px">
      <span>${dateStr} ${timeStr}</span>
      ${durationStr      ? `<span>${durationStr}</span>`                                         : ''}
      ${bonuses.length   ? `<span>${bonuses.length} bonus${bonuses.length !== 1 ? 'es' : ''}</span>` : ''}
      ${totalSpins       ? `<span>${totalSpins} spins</span>`                                    : ''}
    </div>

    <div class="es-summary">
      <div class="sum-start">
        <span class="sum-label">Started</span>
        <span class="sum-amount">${formatMoney(session.start_balance)}</span>
      </div>`;

  bonuses.forEach((b, i) => {
    const bonusWin   = b.end_balance != null ? b.end_balance - b.start_balance : null;
    const runningNet = b.end_balance != null ? b.end_balance - session.start_balance : null;
    const multiplier = bonusWin != null && bonusWin > 0 && session.bet_per_spin > 0
      ? Math.round(bonusWin / session.bet_per_spin) : null;
    const winColor  = bonusWin   != null ? netColor(bonusWin)   : 'var(--text-muted)';
    const sessColor = runningNet != null ? netColor(runningNet) : 'var(--text-muted)';
    const winStr    = bonusWin   != null ? netFmt(bonusWin)     : 'in progress';
    const multStr   = multiplier ? `<small>(${multiplier}x)</small> ` : '';

    html += `
      <div class="sum-seg">
        <div class="sum-seg-header">
          <span class="sum-seg-num">Seg ${i + 1} &middot; ${b.spins || 0} spins</span>
          <div style="text-align:right">
            <div class="sum-seg-type">${typeLabel[b.bonus_type] || b.bonus_type}</div>
            ${b.bonus_video_url ? `<div class="sd-video-link" data-bonus-id="${b.id}" data-url="${b.bonus_video_url}">video</div>` : b.bonus_video ? `<div class="sd-video-link" data-bonus-id="${b.id}" data-filename="${b.bonus_video}">video</div>` : ''}
          </div>
        </div>
        <div class="sum-bonus-win" style="color:${winColor}">${multStr}${winStr}</div>
        ${runningNet != null ? `<div class="sum-seg-running" style="color:${sessColor}">session ${netFmt(runningNet)}</div>` : ''}
        <div id="sd-video-${b.id}"></div>
      </div>`;
  });

  // Final no-bonus segment
  const lastBal  = bonuses.length > 0 && bonuses[bonuses.length - 1].end_balance != null
    ? bonuses[bonuses.length - 1].end_balance
    : session.start_balance;
  const finalNet = hasResult ? session.end_balance - lastBal : null;

  html += `
      <div class="sum-seg">
        <div class="sum-seg-header">
          <span class="sum-seg-num">Seg ${bonuses.length + 1}</span>
          <span class="sum-seg-type" style="color:var(--text-muted)">no bonus</span>
        </div>
        <div class="sum-seg-flow">
          <span class="sum-seg-from">${formatMoney(lastBal)}</span>
          <span class="sum-arrow">&#8594;</span>
          <span class="sum-seg-to">${hasResult ? formatMoney(session.end_balance) : '?'}</span>
          ${finalNet != null ? `<span class="sum-seg-net" style="color:${netColor(finalNet)}">${netFmt(finalNet)}</span>` : ''}
        </div>
      </div>`;

  if (net != null) {
    html += `
      <div class="sum-net">
        <span>Session net</span>
        <span style="color:${netColor(net)};font-weight:bold;font-size:18px">${netFmt(net)}</span>
      </div>`;
  }

  html += `</div>`; // end .es-summary
  screen.innerHTML = html;

  // Wire video links — YouTube embed inline; legacy file fetched as blob
  screen.querySelectorAll('.sd-video-link').forEach(link => {
    link.onclick = async () => {
      const container = document.getElementById(`sd-video-${link.dataset.bonusId}`);

      if (link.dataset.url) {
        window.open(link.dataset.url, '_blank', 'noopener');
        return;
      }

      // Legacy file upload
      link.textContent        = 'loading…';
      link.style.pointerEvents = 'none';
      const blobUrl = await PB.fetchFileBlobUrl('bonuses', link.dataset.bonusId, link.dataset.filename);
      if (!blobUrl) {
        link.textContent        = 'error';
        link.style.color        = 'var(--danger)';
        link.style.pointerEvents = '';
        return;
      }
      const video         = document.createElement('video');
      video.src           = blobUrl;
      video.controls      = true;
      video.autoplay      = true;
      video.style.cssText = 'width:100%;border-radius:6px;margin-top:8px;display:block';
      container.appendChild(video);
      link.textContent        = 'video ▲';
      link.style.pointerEvents = 'none';
    };
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.getElementById('btn-settings').onclick = () => navigate('settings');

document.title = `SlotTracker ${VERSION}`;
document.getElementById('app-version').textContent = VERSION;
navigate('home');
