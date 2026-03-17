const VERSION = 'v0.0010';

// ── PocketBase client ────────────────────────────────────────────────────────

const PB = {
  get url()      { return localStorage.getItem('pb_url')      || 'http://crate:8090'; },
  set url(v)     { localStorage.setItem('pb_url', v.replace(/\/$/, '')); },
  get email()    { return localStorage.getItem('pb_email')    || 'slottracker@dgrpix.net'; },
  set email(v)   { localStorage.setItem('pb_email', v); },
  get password() { return localStorage.getItem('pb_password') || ''; },
  set password(v){ localStorage.setItem('pb_password', v); },

  _token: null,

  async authenticate() {
    const r = await fetch(`${this.url}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: this.email, password: this.password }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error('Authentication failed — check email/password in Settings');
    const data = await r.json();
    this._token = data.token;
    return this._token;
  },

  async _authHeaders(json = false) {
    if (!this._token) await this.authenticate();
    const h = { 'Authorization': `Bearer ${this._token}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  },

  async _fetch(url, opts = {}, retried = false) {
    const freshOpts = { ...opts, signal: AbortSignal.timeout(15000) };
    console.log('[PB] fetch', opts.method || 'GET', url);
    const r = await fetch(url, freshOpts);
    console.log('[PB] response', r.status, url);
    if (r.status === 401 && !retried) {
      this._token = null;
      console.log('[PB] 401 — re-authenticating');
      const token = await this.authenticate();
      const retryOpts = { ...opts, headers: { ...opts.headers, 'Authorization': `Bearer ${token}` } };
      return this._fetch(url, retryOpts, true);
    }
    return r;
  },

  async health() {
    const r = await fetch(`${this.url}/api/health`, { signal: AbortSignal.timeout(5000) });
    return r.ok;
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
    onEnter: showHome,
  },
  settings: {
    id: 'screen-settings',
    title: 'Settings',
    back: 'home',
    fab: false,
    onEnter: showSettings,
  },
  // Remaining screens registered in later steps
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

  document.getElementById('fab').classList.toggle('hidden', !def.fab);

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
    PB._token = null; // force fresh auth check
    await PB.authenticate();
    statusEl.className = 'conn-status ok';
    statusEl.textContent = '● Connected & authenticated — ' + PB.url;
  } catch {
    statusEl.className = 'conn-status error';
    statusEl.textContent = '● Reached PocketBase but authentication failed — check credentials in Settings';
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
    const result   = await PB.list('sessions', { sort: '-start_time', perPage: 200 });
    const sessions = result.items || [];

    if (sessions.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No sessions yet.<br>Tap + to start your first session.</div>';
      return;
    }

    listEl.innerHTML = sessions.map(s => {
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
    }).join('');

    listEl.querySelectorAll('.session-card').forEach(card => {
      card.onclick = () => navigate('session-detail', { sessionId: card.dataset.id });
    });
  } catch (e) {
    listEl.innerHTML = '<div class="empty-state">Could not load sessions — check VPN connection.</div>';
    console.error(e);
  }
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

// ── New Session ──────────────────────────────────────────────────────────────

SCREENS['new-session'] = {
  id: 'screen-new-session',
  title: 'New Session',
  back: 'home',
  fab: false,
  onEnter: showNewSession,
};

let selectedDenom = null;
let pendingPhotoFile = null;  // compressed File, ready to upload

async function showNewSession() {
  // Reset form
  selectedDenom = null;
  pendingPhotoFile = null;
  document.getElementById('ns-casino').value = '';
  document.getElementById('ns-machine').value = '';
  document.getElementById('ns-bet').value = '';
  document.getElementById('ns-start-balance').value = '';
  document.getElementById('photo-input').value = '';
  const placeholder = document.getElementById('photo-placeholder');
  placeholder.textContent = '📷 Tap to photograph machine';
  placeholder.style.color = '';
  document.getElementById('screen-new-session').style.backgroundImage = '';
  const preview = document.getElementById('photo-preview');
  preview.classList.add('hidden');
  preview.src = '';
  document.querySelectorAll('#denom-buttons .pill').forEach(p => p.classList.remove('selected'));
  setFormError('');

  // Populate casino datalist from past sessions
  try {
    const result = await PB.list('sessions', {
      fields: 'casino,machine_name',
      sort: '-created',
      perPage: 500,
    });
    const casinos  = [...new Set(result.items.map(s => s.casino).filter(Boolean))].sort();
    const machines = [...new Set(result.items.map(s => s.machine_name).filter(Boolean))].sort();
    document.getElementById('casino-list').innerHTML  = casinos.map(c  => `<option value="${c}">`).join('');
    document.getElementById('machine-list').innerHTML = machines.map(m => `<option value="${m}">`).join('');
  } catch { /* offline — datalist just stays empty */ }

  // Photo picker — selected photo becomes background of the screen (saves scroll space)
  const nsScreen  = document.getElementById('screen-new-session');
  const picker    = document.getElementById('photo-picker');
  const photoInput = document.getElementById('photo-input');
  nsScreen.style.backgroundImage = '';

  picker.onclick = () => photoInput.click();
  photoInput.onchange = async () => {
    const file = photoInput.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    pendingPhotoFile = compressed;
    const blobUrl = URL.createObjectURL(compressed);
    // Show photo as dimmed screen background instead of inline preview
    nsScreen.style.backgroundImage    = `linear-gradient(rgba(0,0,0,0.60), rgba(0,0,0,0.60)), url("${blobUrl}")`;
    nsScreen.style.backgroundSize     = 'cover';
    nsScreen.style.backgroundPosition = 'center';
    nsScreen.style.backgroundRepeat   = 'no-repeat';
    // Update picker label
    document.getElementById('photo-placeholder').textContent = '✓ Photo attached';
    document.getElementById('photo-placeholder').style.color = 'var(--accent)';
  };

  // Denomination pills
  document.querySelectorAll('#denom-buttons .pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#denom-buttons .pill').forEach(p => p.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDenom = parseFloat(btn.dataset.value);
    };
  });

  // Start Session
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
  btn.disabled = true;
  btn.textContent = 'Starting…';
  setFormError('');

  try {
    const session = await PB.create('sessions', {
      casino,
      machine_name: machine,
      denom: selectedDenom,
      bet_per_spin: bet,
      start_balance: startBal,
      start_time: new Date().toISOString(),
    });

    if (pendingPhotoFile) {
      try {
        await PB.uploadFile('sessions', session.id, 'machine_photo', pendingPhotoFile);
      } catch (e) {
        console.warn('Photo upload failed:', e);
        // Non-fatal — session still starts
      }
    }

    navigate('active-session', { sessionId: session.id });
  } catch (e) {
    setFormError('Could not save session — check VPN connection.');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Start Session';
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

document.getElementById('btn-settings').onclick = () => navigate('settings');
document.getElementById('fab').onclick = () => navigate('new-session');

// ── Active Session ────────────────────────────────────────────────────────────

SCREENS['active-session'] = {
  id: 'screen-active-session',
  title: 'Session',
  back: null,   // no back button — must use End Session
  fab: false,
  onEnter: showActiveSession,
};

let currentSession       = null;
let sessionTimerInterval = null;
let completedBonusSpins  = 0;
let bonusCount           = 0;
let segmentStartBalance  = 0;     // balance at the start of the current spin segment
let bonusStartBalance    = null;  // balance when BONUS! was tapped
let bonusStartTime       = null;  // Date when BONUS! was tapped
let pendingVideoFile     = null;
let bonusSegmentSpins    = 0;     // spins captured at bonus start (used by cancelBonus)

function formatDenom(d) {
  return d < 1 ? `${Math.round(d * 100)}¢` : `$${d}`;
}

function formatMoney(n) {
  return '$' + Number(n).toFixed(2);
}

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

async function showActiveSession({ sessionId }) {
  clearInterval(sessionTimerInterval);
  completedBonusSpins = 0;
  bonusCount          = 0;
  bonusStartBalance   = null;
  bonusStartTime      = null;
  pendingVideoFile    = null;
  bonusSegmentSpins   = 0;

  try {
    currentSession = await PB.get('sessions', sessionId);
  } catch {
    alert('Could not load session — check VPN connection.');
    navigate('home');
    return;
  }

  // Header & info bar
  document.getElementById('page-title').textContent = currentSession.machine_name;
  document.getElementById('as-machine').textContent = currentSession.machine_name;
  document.getElementById('as-sub').textContent =
    `${currentSession.casino} · ${formatDenom(currentSession.denom)} · $${currentSession.bet_per_spin}/spin`;

  document.getElementById('as-start-balance-display').textContent = formatMoney(currentSession.start_balance);
  document.getElementById('as-denom-display').textContent = formatDenom(currentSession.denom);
  document.getElementById('as-bet-display').textContent   = formatMoney(currentSession.bet_per_spin);
  document.getElementById('as-balance').value = '';
  document.getElementById('as-spins').value = '';
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

  // Load any bonuses already saved (handles app refresh mid-session)
  try {
    const result = await PB.list('bonuses', {
      filter: `session='${sessionId}'`,
      sort:   'bonus_time',
      perPage: 500,
    });
    const bonuses = result.items || [];
    bonusCount = bonuses.length;
    bonuses.forEach(b => { if (b.end_balance != null) completedBonusSpins += (b.spins || 0); });
  } catch { /* offline; start fresh */ }

  updateActiveSessionDisplay();

  // Timer
  sessionTimerInterval = setInterval(updateTimers, 1000);
  updateTimers();

  // Buttons
  document.getElementById('btn-bonus').onclick      = startBonus;
  document.getElementById('btn-end-session').onclick = showEndConfirm;

  document.getElementById('as-spins').oninput   = updateActionButtons;
  document.getElementById('as-balance').oninput = updateActionButtons;
  updateActionButtons();

  showPanel('as-main-content');
}

function updateActiveSessionDisplay() {
  document.getElementById('as-bonus-count').textContent  = bonusCount;
  document.getElementById('as-segment-num').textContent  = bonusCount + 1;
  document.getElementById('as-total-spins').textContent  = completedBonusSpins;
}

function updateActionButtons() {
  const hasSpins   = document.getElementById('as-spins').value.trim() !== '';
  const hasBalance = document.getElementById('as-balance').value.trim() !== '';
  const bonusBtn   = document.getElementById('btn-bonus');
  const endBtn     = document.getElementById('btn-end-session');
  const warnEl     = document.getElementById('as-balance-warning');

  // Balance sanity check
  const spins   = parseInt(document.getElementById('as-spins').value) || 0;
  const balance = parseFloat(document.getElementById('as-balance').value);
  const minPossible = segmentStartBalance - (spins * currentSession.bet_per_spin);

  if (hasBalance && spins > 0 && balance < minPossible - 0.01) {
    warnEl.textContent = `Balance seems too low — minimum possible after ${spins} spins at $${currentSession.bet_per_spin}/spin is ${formatMoney(minPossible)}.`;
    warnEl.classList.remove('hidden');
  } else {
    warnEl.classList.add('hidden');
  }

  // BONUS requires both spins and balance
  const bonusBlocked = !hasSpins || !hasBalance;
  bonusBtn.disabled      = bonusBlocked;
  bonusBtn.style.opacity = bonusBlocked ? '0.4' : '';

  // End Session requires only a balance (spins default to 0 if blank)
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

  document.getElementById('as-bip-machine').textContent  = currentSession.machine_name;
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
  document.getElementById('as-bf-machine').textContent  = currentSession.machine_name;
  document.getElementById('as-bf-start-bal').textContent = formatMoney(bonusStartBalance);

  // Clear radio selections
  document.querySelectorAll('input[name="bonus-type"]').forEach(r => { r.checked = false; });

  document.getElementById('bc-end-balance').value = '';
  document.getElementById('bc-video-input').value = '';
  document.getElementById('bc-video-placeholder').classList.remove('hidden');
  document.getElementById('bc-video-name').classList.add('hidden');
  document.getElementById('bc-video-name').textContent = '';
  document.getElementById('bc-error').classList.add('hidden');
  pendingVideoFile = null;

  // Video picker wiring
  const videoPicker = document.getElementById('bc-video-picker');
  const videoInput  = document.getElementById('bc-video-input');
  videoPicker.onclick = () => videoInput.click();
  videoInput.onchange = () => {
    const file = videoInput.files[0];
    if (!file) return;
    pendingVideoFile = file;
    document.getElementById('bc-video-placeholder').classList.add('hidden');
    const nameEl = document.getElementById('bc-video-name');
    nameEl.textContent = '\uD83D\uDCF9 ' + file.name;
    nameEl.classList.remove('hidden');
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
  btn.disabled = true;
  btn.textContent = 'Saving…';
  errorEl.classList.add('hidden');

  try {
    const bonus = await PB.create('bonuses', {
      session:       currentSession.id,
      spins:         bonusSegmentSpins,
      bonus_type:    typeInput.value,
      start_balance: bonusStartBalance,
      end_balance:   endBal,
      bonus_time:    bonusStartTime.toISOString(),
    });

    if (pendingVideoFile) {
      try {
        await PB.uploadFile('bonuses', bonus.id, 'bonus_video', pendingVideoFile);
      } catch (e) {
        console.warn('Video upload failed:', e);
      }
    }

    document.getElementById('as-balance').value = endBal;
    segmentStartBalance = endBal;
    bonusStartBalance   = null;
    bonusStartTime      = null;
    pendingVideoFile    = null;

    showPanel('as-main-content');
    updateActionButtons();
  } catch (e) {
    errorEl.textContent = 'Save failed — check VPN.';
    errorEl.classList.remove('hidden');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Complete Bonus';
  }
}

// ── End Session: show confirm ─────────────────────────────────────────────────

async function showEndConfirm() {
  const endBal         = parseFloat(document.getElementById('as-balance').value);
  const remainingSpins = parseInt(document.getElementById('as-spins').value) || 0;

  document.getElementById('as-ec-machine').textContent = currentSession.machine_name;
  document.getElementById('ec-final-bal').textContent  = formatMoney(endBal);
  document.getElementById('ec-error').classList.add('hidden');

  // Build segment summary
  const summaryEl = document.getElementById('ec-summary');
  summaryEl.innerHTML = '';
  try {
    const result  = await PB.list('bonuses', {
      filter:  `session='${currentSession.id}'`,
      sort:    'bonus_time',
      perPage: 500,
    });
    const bonuses = result.items || [];
    const typeLabel = { free_games: 'Free Games', hold_and_spin: 'Hold & Spin', other: 'Other' };

    const sessionNet = endBal - currentSession.start_balance;
    const netColor = n => n >= 0 ? 'var(--accent)' : 'var(--danger)';
    const netFmt   = n => (n >= 0 ? '+' : '') + formatMoney(n);

    // Starting balance row
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

    // Final segment (remaining spins after last bonus)
    const lastBal = bonuses.length > 0 && bonuses[bonuses.length-1].end_balance != null
      ? bonuses[bonuses.length-1].end_balance
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

    // Session net
    summaryEl.innerHTML += `
      <div class="sum-net">
        <span>Session net</span>
        <span style="color:${netColor(sessionNet)};font-weight:bold;font-size:18px">${netFmt(sessionNet)}</span>
      </div>`;
  } catch {
    summaryEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Could not load segment data</div>';
  }

  document.getElementById('btn-ec-confirm').onclick = () => saveEndSession(endBal);
  document.getElementById('btn-ec-cancel').onclick  = () => showPanel('as-main-content');

  showPanel('as-end-confirm');
}

// ── End Session: save ─────────────────────────────────────────────────────────

async function saveEndSession(endBal) {
  console.log('[saveEndSession] endBal:', endBal, 'sessionId:', currentSession?.id);
  const errorEl = document.getElementById('ec-error');
  const btn     = document.getElementById('btn-ec-confirm');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  errorEl.classList.add('hidden');

  try {
    await PB.update('sessions', currentSession.id, {
      end_balance: endBal,
      end_time:    new Date().toISOString(),
    });
    clearInterval(sessionTimerInterval);
    navigate('home');
  } catch (e) {
    errorEl.textContent = 'Save failed — check VPN.';
    errorEl.classList.remove('hidden');
    console.error(e);
    btn.disabled = false;
    btn.textContent = 'Confirm End Session';
  }
}

SCREENS['session-detail'] = {
  id: 'screen-session-detail',
  title: 'Session Detail',
  back: 'home',
  fab: false,
  onEnter: showSessionDetail,
};

function showSessionDetail({ sessionId }) {
  // Full replay view — coming in next step
  document.getElementById('screen-session-detail').innerHTML =
    `<div style="color:var(--text-muted);padding:40px 20px;text-align:center">Loading session ${sessionId}…</div>`;
}

document.title = `SlotTracker ${VERSION}`;
navigate('home');
