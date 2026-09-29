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

const STORAGE_KEY = 'codm_clan_roster_v2';
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
const shareBtn = document.getElementById('share-roster-btn');

let bestPingRegion = null;
let seedCache = []; // resolved seed members

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

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2800);
}

function applyAccent(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--good', hex);
  document.documentElement.style.setProperty('--accent-glow', hex + '59');
  document.documentElement.style.setProperty('--border-glow', hex + '40');
}

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
  if (CLAN.accent) applyAccent(CLAN.accent);

  if (CLAN.discord) {
    const wrap = document.getElementById('discord-wrap');
    const link = document.getElementById('discord-link');
    if (wrap && link) {
      link.href = CLAN.discord;
      wrap.classList.remove('hidden');
    }
  }

  const recruitEl = document.getElementById('recruit-actions');
  if (recruitEl) {
    recruitEl.innerHTML = '';
    if (CLAN.discord) {
      const a = document.createElement('a');
      a.className = 'btn primary small';
      a.href = CLAN.discord;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Discord';
      recruitEl.appendChild(a);
    }
    if (CLAN.email) {
      const a = document.createElement('a');
      a.className = 'btn secondary small';
      a.href = 'mailto:' + CLAN.email + '?subject=' + encodeURIComponent((CLAN.tag || '') + ' Clan Recruit');
      a.textContent = 'Email';
      recruitEl.appendChild(a);
    }
  }

  renderStreams();
  renderSchedule();
})();

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

function renderStreams() {
  const list = document.getElementById('streams-list');
  const empty = document.getElementById('streams-empty');
  if (!list) return;
  list.querySelectorAll('.stream-card').forEach(el => el.remove());
  const streams = (typeof CLAN !== 'undefined' && CLAN.streams) || [];
  if (!streams.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  streams.forEach(s => {
    const card = document.createElement('div');
    card.className = 'stream-card';
    let src = '';
    if (s.type === 'twitch' && s.id) {
      const parent = location.hostname || 'localhost';
      src = 'https://player.twitch.tv/?channel=' + encodeURIComponent(s.id) + '&parent=' + encodeURIComponent(parent) + '&parent=aross197.github.io';
    } else if (s.type === 'youtube' && s.id) {
      src = 'https://www.youtube.com/embed/' + encodeURIComponent(s.id);
    }
    card.innerHTML =
      '<div class="stream-meta"><h3>' + escapeHtml(s.name || 'Stream') + '</h3><span>' +
      escapeHtml(s.note || s.type || '') + '</span></div>' +
      (src
        ? '<div class="stream-embed"><iframe src="' + escapeAttr(src) + '" allowfullscreen allow="autoplay; encrypted-media"></iframe></div>'
        : '<p class="hint" style="padding:1rem">Invalid stream config</p>');
    list.appendChild(card);
  });
}

function renderSchedule() {
  const list = document.getElementById('schedule-list');
  const empty = document.getElementById('schedule-empty');
  if (!list) return;
  list.querySelectorAll('.schedule-item').forEach(el => el.remove());
  const events = (typeof CLAN !== 'undefined' && CLAN.schedule) || [];
  if (!events.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML =
      '<div><h3>' + escapeHtml(ev.title || 'Event') + '</h3>' +
      '<p>' + escapeHtml(ev.mode || '') + (ev.note ? ' · ' + escapeHtml(ev.note) : '') + '</p></div>' +
      '<div class="schedule-when">' + escapeHtml(ev.when || '') + '</div>';
    list.appendChild(item);
  });
}

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
  for (const r of REGIONS) await testRegion(r.id);
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

async function fetchPlayer(q) {
  const target = API_BASE + encodeURIComponent(q);
  try {
    const res = await fetch(target, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && (data.nickname || data.shortId || data.level)) return data;
    }
  } catch (e) {}
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(target);
  const res = await fetch(proxyUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Network error');
  const wrap = await res.json();
  let data = wrap.contents;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { throw new Error('Bad API response'); }
  }
  if (!data || data.success === false) throw new Error((data && data.error) || 'Player not found');
  if (!(data.nickname || data.shortId || data.level)) throw new Error('Player not found');
  return data;
}

function playerKey(data) {
  return String(data.shortId || data.nickname || data.query || '').toLowerCase();
}

lookupBtn.addEventListener('click', lookupPlayer);
playerInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookupPlayer(); });

async function lookupPlayer() {
  const q = playerInput.value.trim();
  if (!q) return;
  lookupBtn.disabled = true;
  lookupBtn.textContent = '…';
  statsResult.classList.add('hidden');
  statsResult.innerHTML = '';
  try {
    renderLookupResult(await fetchPlayer(q));
  } catch (err) {
    statsResult.innerHTML = '<p class="error-msg">' + escapeHtml(err.message || 'Lookup failed') + '</p>';
    statsResult.classList.remove('hidden');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup';
  }
}

function renderLookupResult(data) {
  const avatar = data.pic || DEFAULT_AVATAR;
  const combined = getCombinedRoster();
  const already = combined.some(f => playerKey(f) === playerKey(data));
  const level = data.level && data.level.current != null ? data.level.current : '—';
  const rank = (data.rank && data.rank.multiplayerRank) || '—';
  const rating = data.rank && data.rank.rating != null ? data.rank.rating : '—';

  statsResult.innerHTML =
    '<img class="avatar" src="' + escapeAttr(avatar) + '" alt="" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
    '<div class="stats-info"><h3>' + escapeHtml(data.nickname || 'Unknown') + '</h3>' +
    '<div class="stats-meta">' +
    '<span>Level <strong>' + escapeHtml(level) + '</strong></span>' +
    '<span>Rank <strong>' + escapeHtml(rank) + '</strong></span>' +
    '<span>Rating <strong>' + escapeHtml(rating) + '</strong></span>' +
    '<span>Country <strong>' + escapeHtml(data.countryCode || '—') + '</strong></span>' +
    (data.shortId ? '<span>ID <strong>' + escapeHtml(data.shortId) + '</strong></span>' : '') +
    '</div></div>' +
    '<button type="button" id="save-friend-btn" class="btn small ' +
    (already ? 'secondary' : 'primary') + '" ' + (already ? 'disabled' : '') + '>' +
    (already ? 'In Clan' : 'Add to Clan') + '</button>';
  statsResult.classList.remove('hidden');

  const saveBtn = document.getElementById('save-friend-btn');
  if (saveBtn && !already) {
    saveBtn.addEventListener('click', () => {
      addFriend(data);
      saveBtn.textContent = 'In Clan';
      saveBtn.className = 'btn small secondary';
      saveBtn.disabled = true;
      toast('Added to clan roster');
    });
  }
}

function getLocalFriends() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function setLocalFriends(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function memberFromApi(data, extra) {
  return Object.assign({
    nickname: data.nickname,
    shortId: data.shortId,
    countryCode: data.countryCode,
    pic: data.pic || '',
    level: data.level && data.level.current,
    rank: data.rank && data.rank.multiplayerRank,
    rating: data.rank && data.rank.rating,
    query: data.shortId || data.nickname,
  }, extra || {});
}

function getCombinedRoster() {
  const local = getLocalFriends();
  const map = new Map();
  seedCache.forEach(m => map.set(playerKey(m), m));
  local.forEach(m => map.set(playerKey(m), Object.assign({}, map.get(playerKey(m)) || {}, m)));
  return Array.from(map.values());
}

function addFriend(data) {
  const list = getLocalFriends();
  const key = playerKey(data);
  if (list.some(f => playerKey(f) === key)) return;
  list.unshift(memberFromApi(data));
  setLocalFriends(list);
  renderFriends();
}

function removeFriend(key) {
  setLocalFriends(getLocalFriends().filter(f => playerKey(f) !== String(key).toLowerCase()));
  // don't remove seed-only entries from display permanently — they'll reappear from seed
  renderFriends();
}

function updateHeroRosterStats() {
  const list = getCombinedRoster();
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
  const list = getCombinedRoster();
  const localKeys = new Set(getLocalFriends().map(playerKey));
  friendsListEl.querySelectorAll('.friend-card').forEach(el => el.remove());
  if (!list.length) {
    emptyFriendsEl.style.display = 'block';
    updateHeroRosterStats();
    return;
  }
  emptyFriendsEl.style.display = 'none';
  list.forEach(f => {
    const key = playerKey(f);
    const isLocal = localKeys.has(key);
    const card = document.createElement('div');
    card.className = 'friend-card';
    const role = f.role ? '<span class="role-badge">' + escapeHtml(f.role) + '</span>' : '';
    card.innerHTML =
      '<img class="avatar sm" src="' + escapeAttr(f.pic || DEFAULT_AVATAR) + '" alt="" onerror="this.src=\'' + DEFAULT_AVATAR + '\'" />' +
      '<div class="stats-info"><h3>' + escapeHtml(f.nickname || f.shortId || 'Unknown') + role + '</h3>' +
      '<div class="stats-meta">' +
      '<span>Lv <strong>' + escapeHtml(f.level != null ? f.level : '—') + '</strong></span>' +
      '<span><strong>' + escapeHtml(f.rank || '—') + '</strong></span>' +
      '<span>★ <strong>' + escapeHtml(f.rating != null ? f.rating : '—') + '</strong></span>' +
      '<span>' + escapeHtml(f.countryCode || '') + '</span></div></div>' +
      '<div class="friend-actions">' +
      '<button type="button" class="btn small secondary refresh-one" data-query="' +
      escapeAttr(f.query || f.shortId || f.nickname) + '">↻</button>' +
      (isLocal
        ? '<button type="button" class="btn small danger-outline remove-one" data-key="' + escapeAttr(key) + '">✕</button>'
        : '') +
      '</div>';
    friendsListEl.appendChild(card);
  });
  friendsListEl.querySelectorAll('.remove-one').forEach(btn => {
    btn.addEventListener('click', () => removeFriend(btn.dataset.key));
  });
  friendsListEl.querySelectorAll('.refresh-one').forEach(btn => {
    btn.addEventListener('click', () => refreshOne(btn.dataset.query, btn));
  });
  updateHeroRosterStats();
}

async function refreshOne(query, btn) {
  if (!query) return;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const data = await fetchPlayer(query);
    const mem = memberFromApi(data);
    const local = getLocalFriends();
    const idx = local.findIndex(f => playerKey(f) === playerKey(mem) || String(f.query).toLowerCase() === String(query).toLowerCase());
    if (idx >= 0) {
      local[idx] = Object.assign({}, local[idx], mem);
      setLocalFriends(local);
    }
    const sidx = seedCache.findIndex(f => playerKey(f) === playerKey(mem) || String(f.query).toLowerCase() === String(query).toLowerCase());
    if (sidx >= 0) seedCache[sidx] = Object.assign({}, seedCache[sidx], mem);
    renderFriends();
  } catch (e) {
    btn.textContent = '!';
    setTimeout(() => { btn.textContent = '↻'; btn.disabled = false; }, 1200);
  }
}

refreshFriendsBtn.addEventListener('click', async () => {
  const all = getCombinedRoster();
  if (!all.length) return;
  refreshFriendsBtn.disabled = true;
  refreshFriendsBtn.textContent = '…';
  for (const f of all) {
    try {
      const data = await fetchPlayer(f.query || f.shortId || f.nickname);
      const mem = memberFromApi(data);
      const local = getLocalFriends();
      const idx = local.findIndex(x => playerKey(x) === playerKey(mem));
      if (idx >= 0) {
        local[idx] = Object.assign({}, local[idx], mem);
        setLocalFriends(local);
      }
      const sidx = seedCache.findIndex(x => playerKey(x) === playerKey(mem));
      if (sidx >= 0) seedCache[sidx] = Object.assign({}, seedCache[sidx], mem);
    } catch (e) {}
  }
  renderFriends();
  refreshFriendsBtn.disabled = false;
  refreshFriendsBtn.textContent = '↻ Refresh';
  toast('Roster refreshed');
});

if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const list = getCombinedRoster();
    const name = (typeof CLAN !== 'undefined' && CLAN.name) || 'Clan';
    const lines = [name + ' roster (' + list.length + '):'];
    list.forEach(f => {
      lines.push(
        '- ' + (f.nickname || f.shortId || '?') +
        (f.role ? ' [' + f.role + ']' : '') +
        ' · ' + (f.rank || '?') +
        ' · ★' + (f.rating != null ? f.rating : '?')
      );
    });
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: name + ' Roster', text: text });
      } else {
        await navigator.clipboard.writeText(text);
        toast('Roster copied to clipboard');
      }
    } catch (e) {
      try {
        await navigator.clipboard.writeText(text);
        toast('Roster copied to clipboard');
      } catch (e2) {
        toast('Could not share');
      }
    }
  });
}

async function loadSeedRoster() {
  const seeds = (typeof CLAN !== 'undefined' && CLAN.seedRoster) || [];
  if (!seeds.length) return;
  for (const s of seeds) {
    const q = s.query || s.uid || s.nickname;
    if (!q) continue;
    try {
      const data = await fetchPlayer(q);
      seedCache.push(memberFromApi(data, { role: s.role || 'Member', query: q, seeded: true }));
    } catch (e) {
      seedCache.push({
        nickname: q,
        query: q,
        role: s.role || 'Member',
        seeded: true,
      });
    }
  }
  renderFriends();
}

renderFriends();
loadSeedRoster();
setTimeout(() => runAllPings(), 400);
