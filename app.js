// COD Mobile region proxies (public HTTPS endpoints in the same metros)
const REGIONS = [
  { id: 'us-east', name: 'US East · Virginia', flag: '🇺🇸', url: 'https://dynamodb.us-east-1.amazonaws.com' },
  { id: 'us-west', name: 'US West · Oregon', flag: '🇺🇸', url: 'https://dynamodb.us-west-2.amazonaws.com' },
  { id: 'us-central', name: 'US Central · Ohio', flag: '🇺🇸', url: 'https://dynamodb.us-east-2.amazonaws.com' },
  { id: 'eu-central', name: 'EU · Frankfurt', flag: '🇩🇪', url: 'https://dynamodb.eu-central-1.amazonaws.com' },
  { id: 'eu-west', name: 'EU · Ireland', flag: '🇮🇪', url: 'https://dynamodb.eu-west-1.amazonaws.com' },
  { id: 'me', name: 'Middle East · Bahrain', flag: '🇧🇭', url: 'https://dynamodb.me-south-1.amazonaws.com' },
  { id: 'sa', name: 'South America · São Paulo', flag: '🇧🇷', url: 'https://dynamodb.sa-east-1.amazonaws.com' },
  { id: 'asia-sg', name: 'Asia · Singapore', flag: '🇸🇬', url: 'https://dynamodb.ap-southeast-1.amazonaws.com' },
  { id: 'asia-jp', name: 'Asia · Tokyo', flag: '🇯🇵', url: 'https://dynamodb.ap-northeast-1.amazonaws.com' },
  { id: 'asia-in', name: 'Asia · Mumbai', flag: '🇮🇳', url: 'https://dynamodb.ap-south-1.amazonaws.com' },
  { id: 'oce', name: 'Oceania · Sydney', flag: '🇦🇺', url: 'https://dynamodb.ap-southeast-2.amazonaws.com' },
];

const regionsEl = document.getElementById('regions');
const testAllBtn = document.getElementById('test-all');
const playerInput = document.getElementById('player-input');
const lookupBtn = document.getElementById('lookup-btn');
const statsResult = document.getElementById('stats-result');

// Build region rows
REGIONS.forEach(r => {
  const row = document.createElement('div');
  row.className = 'region-row';
  row.id = `row-${r.id}`;
  row.innerHTML = `
    <div class="region-name"><span class="region-flag">${r.flag}</span>${r.name}</div>
    <div class="ping-value pending" id="ping-${r.id}">—</div>
    <button class="test-one" data-id="${r.id}">Test</button>
  `;
  regionsEl.appendChild(row);
});

document.querySelectorAll('.test-one').forEach(btn => {
  btn.addEventListener('click', () => testRegion(btn.dataset.id));
});

testAllBtn.addEventListener('click', async () => {
  testAllBtn.disabled = true;
  testAllBtn.textContent = 'Testing…';
  for (const r of REGIONS) {
    await testRegion(r.id);
  }
  testAllBtn.disabled = false;
  testAllBtn.textContent = 'Test All';
});

async function testRegion(id) {
  const region = REGIONS.find(r => r.id === id);
  const el = document.getElementById(`ping-${id}`);
  el.textContent = '…';
  el.className = 'ping-value pending';

  try {
    // Warm-up + median of a few samples for stability
    const samples = [];
    for (let i = 0; i < 4; i++) {
      const start = performance.now();
      await fetch(region.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
      // no-cors doesn't give us status, but the round-trip still happens
      samples.push(performance.now() - start);
    }
    // Drop first (connection setup), take median of rest
    samples.shift();
    samples.sort((a, b) => a - b);
    const median = Math.round(samples[Math.floor(samples.length / 2)]);

    el.textContent = `${median} ms`;
    el.className = 'ping-value ' + (median < 60 ? 'good' : median < 120 ? 'warn' : 'bad');
  } catch (e) {
    el.textContent = 'Fail';
    el.className = 'ping-value bad';
  }
}

// Stats lookup
lookupBtn.addEventListener('click', lookupPlayer);
playerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupPlayer();
});

async function lookupPlayer() {
  const q = playerInput.value.trim();
  if (!q) return;

  lookupBtn.disabled = true;
  lookupBtn.textContent = '…';
  statsResult.classList.add('hidden');
  statsResult.innerHTML = '';

  try {
    const res = await fetch(`https://callofdutymobile.vercel.app/user/${encodeURIComponent(q)}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Player not found');
    }

    const avatar = data.pic || 'https://cdn1.codashop.com/S/content/webstore/codm/images/icon_playerlevel.png';
    const rankImg = data.rank?.image || '';

    statsResult.innerHTML = `
      <img class="avatar" src="${avatar}" alt="avatar" onerror="this.src='https://cdn1.codashop.com/S/content/webstore/codm/images/icon_playerlevel.png'" />
      <div class="stats-info">
        <h3>${escapeHtml(data.nickname || q)}</h3>
        <div class="stats-meta">
          <span>Level <strong>${data.level?.current ?? '—'}</strong></span>
          <span>Rank <strong>${escapeHtml(data.rank?.multiplayerRank || '—')}</strong></span>
          <span>Rating <strong>${data.rank?.rating ?? '—'}</strong></span>
          <span>Country <strong>${escapeHtml(data.countryCode || '—')}</strong></span>
          ${data.shortId ? `<span>ID <strong>${escapeHtml(data.shortId)}</strong></span>` : ''}
        </div>
      </div>
    `;
    statsResult.classList.remove('hidden');
  } catch (err) {
    statsResult.innerHTML = `<p class="error-msg">${escapeHtml(err.message || 'Lookup failed. Try nickname or UID.')}</p>`;
    statsResult.classList.remove('hidden');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

// Auto-run a quick test on load (optional)
// setTimeout(() => testAllBtn.click(), 400);