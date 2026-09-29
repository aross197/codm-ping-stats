# NIGHT RAID · COD Mobile Clan HQ

Full clan website for Call of Duty: Mobile.

**Live (after enabling Pages):** https://aross197.github.io/codm-ping-stats/

## Features

- Clan branding (name, tag, motto, accent color, Discord, email)
- Roster with local + **seed members** from config
- Player lookup (nickname / UID) → Add to Clan
- Server region ping tester (auto on load)
- **Watch** — Twitch / YouTube embeds from config
- **Schedule** — scrims & ranked nights
- UID how-to guide
- Recruit actions (Discord / email)
- Share roster (clipboard / native share)
- Toast feedback, mobile-ready UI

## Customize (`config.js`)

```js
const CLAN = {
  name: 'NIGHT RAID',
  tag: 'NR',
  motto: 'Strike fast. Leave nothing.',
  about: '…',
  recruit: '…',
  discord: 'https://discord.gg/your-invite',
  email: 'clan@example.com',
  accent: '#00e5a0',
  seedRoster: [
    { query: 'YourUID', role: 'Leader' },
    { query: 'FriendNick', role: 'Member' },
  ],
  streams: [
    { name: 'Captain', type: 'twitch', id: 'channelname', note: 'Ranked' },
    { name: 'VOD', type: 'youtube', id: 'VIDEO_ID', note: 'Scrim' },
  ],
  schedule: [
    { title: 'Ranked Push', when: 'Fri 9pm', mode: 'Hardpoint', note: 'Mic on' },
  ],
};
```

## Enable GitHub Pages

1. https://github.com/aross197/codm-ping-stats/settings/pages  
2. Source: **Deploy from a branch** → `main` / `/ (root)` → Save  
3. Open https://aross197.github.io/codm-ping-stats/

## Limits (by design)

- No live match spectating from the web (game-only)
- No Activision password login on this site
- Pings are regional estimates, not in-game UDP
- Personal roster adds are per-browser; use `seedRoster` for a shared list

Not affiliated with Activision / TiMi. MIT license.
