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
const API_BASE = 'https://callofdutymobile.vercel.app/user/';

const regionsEl = document.getElementById('regions');
const testAllBtn = document.getElementById('test-all');
const playerInput = document.getElementById('player-input');
const lookupBtn = document.getElementById('lookup-btn');
const statsResult = document.getElementById('stats-result');
const friendsListEl = document.getElementById('friends-list');
const emptyFriendsEl = document.getElementById('empty-friends');
const refreshFriendsBtn = document.getElementById('refresh-friends');

let bestPingRegion = null;

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

// Clan config
(function applyClanConfig() {
  if (typeof CLAN === 'undefined') return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.textContent = val;
  };
  set('clan-name', CLAN.name);
  set('clan-tag', CLAN.tag);
  set('clan-motto', CLAN.motto);
  set('clan-about', CLAN.about);
  set('clan-recruit', CLAN.recruit);
  set('footer-name', CLAN.name);
  document.title = (CLAN.name || 'Clan') + ' · COD Mobile Clan';

  if (CLAN.discord) {
    const wrap = document.getElementById('discord-wrap');
    const link = document.getElementById('discord-link');
    if (wrap && link) {
      link.href = CLAN.discord;
      wrap.classList.remove('hidden');
    }
  }
})();

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Pings
REGIONS.forEach(r => {
  const row = document.createElement('div');
  row.className = 'region-row';
  row.innerHTML =
    '<div class="region-name"><span class="region-flag">' + r.flag + '</span>' + r.name + '</div>' +
    '<div class="ping-value pending" id="ping-' + r.id + '">—</div>' +
    '<button type="button" class="test-one" data-id="' + r.id + '">Test</button>';
  regionsEl.appendChild(row);
});

document.querySelectorAll('.test-one').forEach(btn => {
  btn.addEventListener('click', () => testRegion(btn.dataset.id));
});

testAllBtn.addEventListener('click', runAllPings);

async function runAllPings() {
  testAllBtn.disabled = true;
  testAllBtn.textContent = 'Testing…';
  bestPingRegion = null;
  for (const r of REGIONS) {
    await testRegion(r.id);
  }
  testAllBtn.disabled = false;
  testAllBtn.textContent = 'Test All';
  updateHeroBestPing();
}

async function testRegion(id) {
  const region = REGIONS.find(r => r.id === id);
  const el = document.getElementById('ping-' + id);
  if (!el || !region) return;
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

// Stats API with CORS fallbacks
async function fetchPlayer(q) {
  const target = API_BASE + encodeURIComponent(q);
  const urls = [
    target,
    'https://corsproxy.io/?' + encodeURIComponent(target),
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(target),
  ];

  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || data.success === false) {
        throw new Error((data && data.error) || 'Player not found');
      }
      // Normalize: some proxies wrap; direct API returns success + fields
      if (data.success && (data.nickname || data.shortId || data.level)) return data;
      if (data.nickname || data.shortId) return data;
      throw new Error('Player not found');
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Lookup failed');
}

function playerKey(data) {
  return String(data.shortId || data.nickname || '').toLowerCase();
}

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
    const data = await fetchPlayer(q);
    renderLookupResult(data);
  } catch (err) {
    statsResult.innerHTML =
      '<p class="error-msg">' +
      escapeHtml(err.message || 'Lookup failed. Check nickname/UID and try again.') +
      '</p>';
    statsResult.classList.remove('hidden');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup';
  }
}

function renderLookupResult(data) {
  const avatar = data.pic || DEFAULT_AVATAR;
  const alreadySaved = getFriends().some(f => playerKey(f) === playerKey(data));
  const level = data.level && data.level.current != null ? data.level.current : '—';
  const rank = (data.rank && data.rank.multiplayerRank) || '—';
  const rating = data.rank && data.rank.rating != null ? data.rank.rating : '—';

  statsResult.innerHTML =
    '<img class="avatar" src="' + escapeAttr(avatar) + '" alt="" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
    '<div class="stats-info">' +
      '<h3>' + escapeHtml(data.nickname || 'Unknown') + '</h3>' +
      '<div class="stats-meta">' +
        '<span>Level <strong>' + escapeHtml(level) + '</strong></span>' +
        '<span>Rank <strong>' + escapeHtml(rank) + '</strong></span>' +
        '<span>Rating <strong>' + escapeHtml(rating) + '</strong></span>' +
        '<span>Country <strong>' + escapeHtml(data.countryCode || '—') + '</strong></span>' +
        (data.shortId ? '<span>ID <strong>' + escapeHtml(data.shortId) + '</strong></span>' : '') +
      '</div>' +
    '</div>' +
    '<button type="button" id="save-friend-btn" class="btn small ' +
      (alreadySaved ? 'secondary' : 'primary') + '" ' + (alreadySaved ? 'disabled' : '') + '>' +
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

function memberFromApi(data) {
  return {
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

function addFriend(data) {
  const list = getFriends();
  const key = playerKey(data);
  if (list.some(f => playerKey(f) === key)) return;
  list.unshift(memberFromApi(data));
  setFriends(list);
  renderFriends();
}

function removeFriend(key) {
  setFriends(getFriends().filter(f => playerKey(f) !== String(key).toLowerCase()));
  renderFriends();
}

function updateHeroRosterStats() {
  const list = getFriends();
  const countEl = document.getElementById('roster-count');
  const avgEl = document.getElementById('avg-rating');
  if (countEl) countEl.textContent = String(list.length);
  if (avgEl) {
    const ratings = list.map(f => Number(f.rating)).filter(n => !isNaN(n) && n > 0);
    avgEl.textContent = ratings.length
      ? String(Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length))
      : '—';
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
    card.innerHTML =
      '<img class="avatar sm" src="' + escapeAttr(f.pic || DEFAULT_AVATAR) + '" alt="" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
      '<div class="stats-info">' +
        '<h3>' + escapeHtml(f.nickname || f.shortId || 'Unknown') + '</h3>' +
        '<div class="stats-meta">' +
          '<span>Lv <strong>' + escapeHtml(f.level != null ? f.level : '—') + '</strong></span>' +
          '<span><strong>' + escapeHtml(f.rank || '—') + '</strong></span>' +
          '<span>★ <strong>' + escapeHtml(f.rating != null ? f.rating : '—') + '</strong></span>' +
          '<span>' + escapeHtml(f.countryCode || '') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="friend-actions">' +
        '<button type="button" class="btn small secondary refresh-one" data-query="' +
          escapeAttr(f.query || f.shortId || f.nickname) + '">↻</button>' +
        '<button type="button" class="btn small danger-outline remove-one" data-key="' +
          escapeAttr(key) + '">✕</button>' +
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
    const idx = list.findIndex(
      f => playerKey(f) === key || String(f.query || '').toLowerCase() === String(query).toLowerCase()
    );
    if (idx >= 0) {
      list[idx] = memberFromApi(data);
      setFriends(list);
      renderFriends();
    }
  } catch (e) {
    btn.textContent = '!';
    setTimeout(() => {
      btn.textContent = '↻';
      btn.disabled = false;
    }, 1200);
  }
}

refreshFriendsBtn.addEventListener('click', async () => {
  const list = getFriends();
  if (!list.length) return;
  refreshFriendsBtn.disabled = true;
  refreshFriendsBtn.textContent = '…';
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    try {
      const data = await fetchPlayer(f.query || f.shortId || f.nickname);
      list[i] = memberFromApi(data);
    } catch (e) { /* keep old */ }
  }
  setFriends(list);
  renderFriends();
  refreshFriendsBtn.disabled = false;
  refreshFriendsBtn.textContent = '↻ Refresh';
});

// Boot
renderFriends();
setTimeout(() => runAllPings(), 600);
