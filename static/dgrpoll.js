(function () {
  const PB_URL = 'https://crate.myqnapcloud.com:9090';
  const VOTER_KEY = 'dgrpix_voter_id';
  const VOTED_PREFIX = 'dgrpix_voted_';

  function getVoterId() {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  }

  function getVotedOption(pollId) {
    return localStorage.getItem(VOTED_PREFIX + pollId);
  }

  function setVotedOption(pollId, optionId) {
    localStorage.setItem(VOTED_PREFIX + pollId, optionId);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  async function fetchTally(pollId) {
    const filter = encodeURIComponent(`pollKey="${pollId}"`);
    const url = `${PB_URL}/api/collections/votes/records?filter=${filter}&fields=optionId&perPage=500`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Tally fetch failed (${res.status})`);
    const data = await res.json();
    const counts = {};
    for (const item of data.items) {
      counts[item.optionId] = (counts[item.optionId] || 0) + 1;
    }
    return counts;
  }

  async function submitVote(pollId, optionId) {
    const voterId = getVoterId();
    const res = await fetch(`${PB_URL}/api/collections/votes/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollKey: pollId, optionId, voterId }),
    });
    if (res.status === 400) {
      // Likely the unique-index dedupe — treat as already-voted (success).
      return { alreadyVoted: true };
    }
    if (!res.ok) throw new Error(`Vote failed (${res.status})`);
    return { alreadyVoted: false };
  }

  function renderResults(el, poll, counts, votedOption) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const optionsHtml = poll.options.map(opt => {
      const count = counts[opt.id] || 0;
      const pct = total === 0 ? 0 : Math.round((count / total) * 100);
      const isVoted = opt.id === votedOption;
      return `
        <div class="dgrpoll-result${isVoted ? ' dgrpoll-voted' : ''}">
          <div class="dgrpoll-result-label">
            <span>${escapeHtml(opt.label)}${isVoted ? ' ✓' : ''}</span>
            <span class="dgrpoll-result-count">${count} (${pct}%)</span>
          </div>
          <div class="dgrpoll-bar"><div class="dgrpoll-bar-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');
    el.innerHTML = `
      <div class="dgrpoll-question">${escapeHtml(poll.question)}</div>
      <div class="dgrpoll-results">${optionsHtml}</div>
      <div class="dgrpoll-footer">${total} vote${total === 1 ? '' : 's'}</div>
    `;
  }

  function renderVoting(el, poll) {
    const optionsHtml = poll.options.map(opt =>
      `<button class="dgrpoll-option" data-option-id="${escapeHtml(opt.id)}">${escapeHtml(opt.label)}</button>`
    ).join('');
    el.innerHTML = `
      <div class="dgrpoll-question">${escapeHtml(poll.question)}</div>
      <div class="dgrpoll-options">${optionsHtml}</div>
      <div class="dgrpoll-footer"><a href="#" class="dgrpoll-show-results">Just show me the results</a></div>
    `;

    el.querySelectorAll('.dgrpoll-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        const optionId = btn.dataset.optionId;
        el.querySelectorAll('.dgrpoll-option').forEach(b => b.disabled = true);
        try {
          await submitVote(poll.id, optionId);
          setVotedOption(poll.id, optionId);
          const counts = await fetchTally(poll.id);
          renderResults(el, poll, counts, optionId);
        } catch (err) {
          const errEl = document.createElement('div');
          errEl.className = 'dgrpoll-error';
          errEl.textContent = err.message;
          el.appendChild(errEl);
          el.querySelectorAll('.dgrpoll-option').forEach(b => b.disabled = false);
        }
      });
    });

    el.querySelector('.dgrpoll-show-results').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const counts = await fetchTally(poll.id);
        renderResults(el, poll, counts, null);
      } catch (err) {
        const errEl = document.createElement('div');
        errEl.className = 'dgrpoll-error';
        errEl.textContent = err.message;
        el.appendChild(errEl);
      }
    });
  }

  async function hydratePoll(el) {
    const pollId = el.dataset.pollId;
    const pollData = el.dataset.poll;
    if (!pollId || !pollData) return;

    let poll;
    try {
      poll = JSON.parse(pollData);
    } catch (e) {
      el.innerHTML = '<div class="dgrpoll-error">Poll data is malformed.</div>';
      return;
    }

    const votedOption = getVotedOption(pollId);
    if (votedOption) {
      try {
        const counts = await fetchTally(pollId);
        renderResults(el, poll, counts, votedOption);
      } catch (err) {
        el.innerHTML = `<div class="dgrpoll-error">Failed to load poll results: ${escapeHtml(err.message)}</div>`;
      }
    } else {
      renderVoting(el, poll);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.poll').forEach(hydratePoll);
  });
})();
