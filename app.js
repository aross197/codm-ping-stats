// COD Mobile region proxies
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

const STORAGE_KEY = 'codm_clan_roster';
const DEFAULT_AVATAR = 'https://cdn1.codashop.com/S/content/webstore/codm/images/icon_playerlevel.png';

const regionsEl = document.getElementById('regions');
const testAllBtn = document.getElementById('test-all');
const playerInput = document.getElementById('player-input');
const lookupBtn = document.getElementById('lookup-btn');
const statsResult = document.getElementById('stats-result');
const friendsListEl = document.getElementById('friends-list');
const emptyFriendsEl = document.getElementById('empty-friends');
const refreshFriendsBtn = document.getElementById('refresh-friends');

let lastLookup = null;
let bestPingRegion = null;

// ── Apply clan config ────────────────────────────────────────
(function applyClanConfig() {
  if (typeof CLAN === 'undefined') return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('clan-name', CLAN.name);
  set('clan-tag', CLAN.tag);
  set('clan-motto', CLAN.motto);
  set('clan-about', CLAN.about);
  set('footer-name', CLAN.name);
  document.title = CLAN.name + ' · COD Mobile Clan';
})();

// ── Nav active state ─────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// ── Ping tester ──────────────────────────────────────────────
REGIONS.forEach(r => {
  const row = document.createElement('div');
  row.className = 'region-row';
  row.id = 'row-' + r.id;
  row.innerHTML =
    '<div class="region-name"><span class="region-flag">' + r.flag + '</span>' + r.name + '</div>' +
    '<div class="ping-value pending" id="ping-' + r.id + '">—</div>' +
    '<button class="test-one" data-id="' + r.id + '">Test</button>';
  regionsEl.appendChild(row);
});

document.querySelectorAll('.test-one').forEach(btn => {
  btn.addEventListener('click', () => testRegion(btn.dataset.id));
});

testAllBtn.addEventListener('click', async () => {
  testAllBtn.disabled = true;
  testAllBtn.textContent = 'Testing…';
  bestPingRegion = null;
  for (const r of REGIONS) {
    await testRegion(r.id);
  }
  testAllBtn.disabled = false;
  testAllBtn.textContent = 'Test All';
  updateHeroBestPing();
});

async function testRegion(id) {
  const region = REGIONS.find(r => r.id === id);
  const el = document.getElementById('ping-' + id);
  el.textContent = '…';
  el.className = 'ping-value pending';

  try {
    const samples = [];
    for (let i = 0; i < 4; i++) {
      const start = performance.now();
      await fetch(region.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
      samples.push(performance.now() - start);
    }
    samples.shift();
    samples.sort((a, b) => a - b);
    const median = Math.round(samples[Math.floor(samples.length / 2)]);

    el.textContent = median + ' ms';
    el.className = 'ping-value ' + (median < 60 ? 'good' : median < 120 ? 'warn' : 'bad');

    if (!bestPingRegion || median < bestPingRegion.ms) {
      bestPingRegion = { ms: median, name: region.name.split('·')[0].trim() };
    }
  } catch (e) {
    el.textContent = 'Fail';
    el.className = 'ping-value bad';
  }
}

function updateHeroBestPing() {
  const el = document.getElementById('best-ping');
  if (el && bestPingRegion) {
    el.textContent = bestPingRegion.ms + 'ms';
    el.title = bestPingRegion.name;
  }
}

// ── Stats API ────────────────────────────────────────────────
async function fetchPlayer(q) {
  const res = await fetch('https://callofdutymobile.vercel.app/user/' + encodeURIComponent(q));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Player not found');
  return data;
}

function playerKey(data) {
  return (data.shortId || data.nickname || '').toLowerCase();
}

// ── Lookup ───────────────────────────────────────────────────
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
  lastLookup = null;

  try {
    const data = await fetchPlayer(q);
    lastLookup = data;
    renderLookupResult(data);
  } catch (err) {
    statsResult.innerHTML = '<p class="error-msg">' + escapeHtml(err.message || 'Lookup failed. Try nickname or UID.') + '</p>';
    statsResult.classList.remove('hidden');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup';
  }
}

function renderLookupResult(data) {
  const avatar = data.pic || DEFAULT_AVATAR;
  const alreadySaved = getFriends().some(f => playerKey(f) === playerKey(data));

  statsResult.innerHTML =
    '<img class="avatar" src="' + escapeAttr(avatar) + '" alt="avatar" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
    '<div class="stats-info">' +
      '<h3>' + escapeHtml(data.nickname || 'Unknown') + '</h3>' +
      '<div class="stats-meta">' +
        '<span>Level <strong>' + (data.level && data.level.current != null ? data.level.current : '—') + '</strong></span>' +
        '<span>Rank <strong>' + escapeHtml((data.rank && data.rank.multiplayerRank) || '—') + '</strong></span>' +
        '<span>Rating <strong>' + (data.rank && data.rank.rating != null ? data.rank.rating : '—') + '</strong></span>' +
        '<span>Country <strong>' + escapeHtml(data.countryCode || '—') + '</strong></span>' +
        (data.shortId ? '<span>ID <strong>' + escapeHtml(data.shortId) + '</strong></span>' : '') +
      '</div>' +
    '</div>' +
    '<button id="save-friend-btn" class="btn small ' + (alreadySaved ? 'secondary' : 'primary') + '" ' + (alreadySaved ? 'disabled' : '') + '>' +
      (alreadySaved ? 'In Clan' : 'Add to Clan') +
    '</button>';

  statsResult.classList.remove('hidden');

  const saveBtn = document.getElementById('save-friend-btn');
  if (saveBtn && !alreadySaved) {
    saveBtn.addEventListener('click', () => {
      addFriend(data);
      saveBtn.textContent = 'In Clan';
      saveBtn.className = 'btn small secondary';
      saveBtn.disabled = true;
    });
  }
}

// ── Roster (localStorage) ────────────────────────────────────
function getFriends() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function setFriends(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addFriend(data) {
  const list = getFriends();
  const key = playerKey(data);
  if (list.some(f => playerKey(f) === key)) return;
  list.unshift({
    nickname: data.nickname,
    shortId: data.shortId,
    countryCode: data.countryCode,
    pic: data.pic || '',
    level: data.level && data.level.current,
    rank: data.rank && data.rank.multiplayerRank,
    rating: data.rank && data.rank.rating,
    query: data.shortId || data.nickname,
  });
  setFriends(list);
  renderFriends();
}

function removeFriend(key) {
  const list = getFriends().filter(f => playerKey(f) !== key.toLowerCase());
  setFriends(list);
  renderFriends();
}

function updateHeroRosterStats() {
  const list = getFriends();
  const countEl = document.getElementById('roster-count');
  const avgEl = document.getElementById('avg-rating');
  if (countEl) countEl.textContent = list.length;

  if (avgEl) {
    const ratings = list.map(f => Number(f.rating)).filter(n => !isNaN(n) && n > 0);
    if (ratings.length) {
      avgEl.textContent = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    } else {
      avgEl.textContent = '—';
    }
  }
}

function renderFriends() {
  const list = getFriends();
  friendsListEl.querySelectorAll('.friend-card').forEach(el => el.remove());

  if (list.length === 0) {
    emptyFriendsEl.style.display = 'block';
    updateHeroRosterStats();
    return;
  }
  emptyFriendsEl.style.display = 'none';

  list.forEach(f => {
    const key = playerKey(f);
    const card = document.createElement('div');
    card.className = 'friend-card';
    card.dataset.key = key;
    card.innerHTML =
      '<img class="avatar sm" src="' + escapeAttr(f.pic || DEFAULT_AVATAR) + '" alt="" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
      '<div class="stats-info">' +
        '<h3>' + escapeHtml(f.nickname || f.shortId || 'Unknown') + '</h3>' +
        '<div class="stats-meta">' +
          '<span>Lv <strong>' + (f.level != null ? f.level : '—') + '</strong></span>' +
          '<span><strong>' + escapeHtml(f.rank || '—') + '</strong></span>' +
          '<span>★ <strong>' + (f.rating != null ? f.rating : '—') + '</strong></span>' +
          '<span>' + escapeHtml(f.countryCode || '') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="friend-actions">' +
        '<button class="btn small secondary refresh-one" data-query="' + escapeAttr(f.query || f.shortId || f.nickname) + '">↻</button>' +
        '<button class="btn small danger-outline remove-one" data-key="' + escapeAttr(key) + '">✕</button>' +
      '</div>';
    friendsListEl.appendChild(card);
  });

  friendsListEl.querySelectorAll('.remove-one').forEach(btn => {
    btn.addEventListener('click', () => removeFriend(btn.dataset.key));
  });
  friendsListEl.querySelectorAll('.refresh-one').forEach(btn => {
    btn.addEventListener('click', () => refreshOneFriend(btn.dataset.query, btn));
  });

  updateHeroRosterStats();
}

async function refreshOneFriend(query, btn) {
  if (!query) return;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const data = await fetchPlayer(query);
    const list = getFriends();
    const key = playerKey(data);
    const idx = list.findIndex(f => playerKey(f) === key || (f.query || '').toLowerCase() === query.toLowerCase());
    if (idx >= 0) {
      list[idx] = {
        nickname: data.nickname,
        shortId: data.shortId,
        countryCode: data.countryCode,
        pic: data.pic || '',
        level: data.level && data.level.current,
        rank: data.rank && data.rank.multiplayerRank,
        rating: data.rank && data.rank.rating,
        query: data.shortId || data.nickname,
      };
      setFriends(list);
      renderFriends();
    }
  } catch (e) {
    btn.textContent = '!';
    setTimeout(() => { btn.textContent = '↻'; btn.disabled = false; }, 1200);
  }
}

refreshFriendsBtn.addEventListener('click', async () => {
  const list = getFriends();
  if (list.length === 0) return;
  refreshFriendsBtn.disabled = true;
  refreshFriendsBtn.textContent = '…';
  for (const f of list) {
    try {
      const data = await fetchPlayer(f.query || f.shortId || f.nickname);
      const key = playerKey(data);
      const idx = list.findIndex(x => playerKey(x) === key || playerKey(x) === playerKey(f));
      if (idx >= 0) {
        list[idx] = {
          nickname: data.nickname,
          shortId: data.shortId,
          countryCode: data.countryCode,
          pic: data.pic || '',
          level: data.level && data.level.current,
          rank: data.rank && data.rank.multiplayerRank,
          rating: data.rank && data.rank.rating,
          query: data.shortId || data.nickname,
        };
      }
    } catch (e) { /* skip */ }
  }
  setFriends(list);
  renderFriends();
  refreshFriendsBtn.disabled = false;
  refreshFriendsBtn.textContent = '↻ Refresh';
});

// ── Helpers ──────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

// Init
renderFriends();
